// /controllers/aiController.js
const asyncHandler = require('express-async-handler');
// We no longer need axios for this mock version
// const axios = require('axios');

// --- NEW: MOCK AI GENERATOR ---
const generateMockItinerary = (destinationName, duration, weatherForecast) => {
    // This function creates a believable but fake AI response.
    const suggestions = [];
    for (let i = 1; i <= duration; i++) {
        const dayWeather = weatherForecast.find(day => day.date.endsWith(`-0${i}`) || day.date.endsWith(`-${i}`)) || { description: 'clear' };
        
        let activity1, activity2;
        
        // Simple logic based on weather
        if (dayWeather.description.includes('rain')) {
            activity1 = `Visit the ${destinationName} Museum (Indoor Activity)`;
            activity2 = `Enjoy a coffee at a local indoor cafe`;
        } else {
            activity1 = `Morning walk at a famous local park`;
            activity2 = `Explore the main market in the evening`;
        }

        suggestions.push({
            day: i,
            activities: [activity1, activity2]
        });
    }
    return { suggestions };
};


// @desc    Suggest an itinerary based on destination and weather (MOCK VERSION)
// @route   POST /api/ai/suggest-itinerary
// @access  Private
const suggestItinerary = asyncHandler(async (req, res) => {
    const { destinationName, duration, weatherForecast } = req.body;

    if (!destinationName || !duration || !weatherForecast) {
        res.status(400);
        throw new Error('Destination, duration, and weather forecast are required.');
    }

    console.log("--- MOCK AI ITINERARY ---");
    console.log("Generating a mock AI response as the live API is unreachable.");
    
    const mockResponse = generateMockItinerary(destinationName, duration, weatherForecast);
    
    // Simulate a real API delay to make it feel authentic
    setTimeout(() => {
        res.status(200).json(mockResponse);
    }, 1500); // Wait 1.5 seconds before responding

});

module.exports = {
    suggestItinerary,
};