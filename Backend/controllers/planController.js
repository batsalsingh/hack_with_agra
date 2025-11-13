// /controllers/planController.js
const asyncHandler = require('express-async-handler');
const axios = require('axios');

const simulateFlightCost = (distanceKm) => { if (distanceKm < 200) return null; const baseFare = 2500; const perKmCost = 5.5; return Math.round((baseFare + distanceKm * perKmCost) / 100) * 100; };
const simulateBusCost = (distanceKm) => { if (distanceKm > 1000) return null; const perKmCost = 1.8; return Math.round((distanceKm * perKmCost) / 50) * 50; };
const simulateCarCost = (distanceKm) => { const perKmCost = 15; return Math.round((distanceKm * perKmCost) / 100) * 100; };
const simulateHotelCost = (destinationTier, duration) => { const baseHotelRate = { 1: 5000, 2: 3000, 3: 1500 }; const rate = baseHotelRate[destinationTier] || 3000; return rate * duration; };
const generateMockForecast = (duration) => { const f = []; const d = ['clear sky', 'few clouds', 'haze']; for (let i = 0; i < duration; i++) { const dt = new Date(); dt.setDate(dt.getDate() + i); f.push({ date: dt.toISOString().split('T')[0], temp_max: Math.floor(Math.random() * 11) + 15, temp_min: Math.floor(Math.random() * 10) + 5, description: d[Math.floor(Math.random() * d.length)], icon: "02d" }); } return f; };
const formatCityForUrl = (cityName) => cityName.toLowerCase().replace(/\s+/g, '-');
const getTierForCity = (mapboxContext) => { if (!mapboxContext) return 2; const majorMetros = /Mumbai|Delhi|Bangalore|Chennai|Kolkata|Hyderabad|Goa/i; for (const context of mapboxContext) { if (context.id.startsWith('place') && context.text.match(majorMetros)) { return 1; } if (context.id.startsWith('place')) { return 2; } } return 3; };

const generateTripBlueprint = asyncHandler(async (req, res) => {
    const { origin, destinationName, departureDate, duration, travelers } = req.body;
    if (!origin || !destinationName || !departureDate || !duration || !travelers) { res.status(400); throw new Error('Missing required fields'); }

    const mapboxApiKey = process.env.MAPBOX_API_KEY;
    if (!mapboxApiKey) { res.status(500); throw new Error('Server configuration error: Mapbox API key is missing.'); }

    const destGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destinationName)}.json?access_token=${mapboxApiKey}&limit=1&country=IN`;
    const destGeocodeResponse = await axios.get(destGeocodeUrl);
    if (!destGeocodeResponse.data || destGeocodeResponse.data.features.length === 0) { res.status(404); throw new Error('Could not find the destination city.'); }
    
    const destinationFeature = destGeocodeResponse.data.features[0];
    const destination = { name: destinationFeature.text, lon: destinationFeature.center[0], lat: destinationFeature.center[1], tier: getTierForCity(destinationFeature.context) };
    
    const originGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(origin)}.json?access_token=${mapboxApiKey}&limit=1&country=IN`;
    const originGeocodeResponse = await axios.get(originGeocodeUrl);
    if (!originGeocodeResponse.data || originGeocodeResponse.data.features.length === 0) { res.status(400); throw new Error('Could not find the origin city.'); }
    
    const originCoords = originGeocodeResponse.data.features[0].center;
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.join(',')};${destination.lon},${destination.lat}?access_token=${mapboxApiKey}`;
    const directionsResult = await axios.get(directionsUrl);
    
    const distanceKm = directionsResult.data.routes[0].distance / 1000;
    const forecast = generateMockForecast(parseInt(duration));

    const flightCost = simulateFlightCost(distanceKm);
    const busCost = simulateBusCost(distanceKm);
    const carCost = simulateCarCost(distanceKm);
    const hotelCost = simulateHotelCost(destination.tier, duration);
    
    const originUrl = formatCityForUrl(origin);
    const destUrl = formatCityForUrl(destination.name);

    const transportOptions = { flight: { costPerPerson: flightCost, link: `https://www.skyscanner.co.in/transport/flights-from/${originUrl}-to/${destUrl}` }, bus: { costPerPerson: busCost, link: `https://www.redbus.in/bus-tickets/${originUrl}-to-${destUrl}` }, car: { totalCost: carCost, link: `https://www.olacabs.com/outstation` }, };
    const accommodation = { estimatedTotalCost: hotelCost, link: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination.name)}` };
    
    const totalHotelCost = hotelCost;
    const otherCosts = (1500 * destination.tier) * duration * travelers;
    const cheapestTransport = Math.min((flightCost || Infinity) * travelers, (busCost || Infinity) * travelers, carCost || Infinity);
    const totalEstimatedCost = totalHotelCost + otherCosts + cheapestTransport;

    const blueprint = { tripDetails: { origin, destinationName: destination.name, departureDate, duration, travelers }, weatherForecast: forecast, transportOptions, accommodation, budget: { totalEstimatedCost: Math.round(totalEstimatedCost / 100) * 100, costPerPerson: Math.round(totalEstimatedCost / travelers / 100) * 100, } };
    res.status(200).json(blueprint);
});

module.exports = { generateTripBlueprint };