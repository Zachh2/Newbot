const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "weather",
    hasPermssion: 0,
    version: "1.0.0",
    credits: "Jonell Magallanes",
    description: "Get accurate weather information with photo",
    usePrefix: true,
    commandCategory: "Utility",
    usages: "[city name]",
    cooldowns: 10,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
        return api.sendMessage(
            "🌤️ 𝗪𝗘𝗔𝗧𝗛𝗘𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗\n━━━━━━━━━━━━━━━━━━\n📝 Please provide a city name\n💡 Usage: weather manila\n💡 Example: weather new york",
            threadID, messageID
        );
    }

    const city = args.join(" ");
    
    try {
        api.sendMessage("⏳ Getting weather information...", threadID, messageID);

        // Free Weather API - OpenWeatherMap
        const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=da0e33d3e18abbb4e5f10b63c50c9b87`;
        
        const weatherResponse = await axios.get(weatherApiUrl);
        const weatherData = weatherResponse.data;

        if (weatherData.cod !== 200) {
            return api.sendMessage(
                "❌ 𝗪𝗘𝗔𝗧𝗛𝗘𝗥 𝗘𝗥𝗥𝗢𝗥\n━━━━━━━━━━━━━━━━━━\nCity not found. Please check the spelling and try again.",
                threadID, messageID
            );
        }

        // Get weather photo based on condition
        const weatherCondition = weatherData.weather[0].main.toLowerCase();
        const weatherPhotoUrl = await getWeatherPhoto(weatherCondition, city);
        
        // Format weather information
        const temperature = Math.round(weatherData.main.temp);
        const feelsLike = Math.round(weatherData.main.feels_like);
        const humidity = weatherData.main.humidity;
        const windSpeed = weatherData.wind.speed;
        const description = weatherData.weather[0].description;
        const country = weatherData.sys.country;
        const cityName = weatherData.name;
        
        // Get additional details
        const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString();
        const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString();
        const visibility = (weatherData.visibility / 1000).toFixed(1);
        const pressure = weatherData.main.pressure;

        const weatherMessage = 
            `🌤️ 𝗪𝗘𝗔𝗧𝗛𝗘𝗥 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡\n━━━━━━━━━━━━━━━━━━\n` +
            `📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${cityName}, ${country}\n` +
            `📊 𝗖𝗼𝗻𝗱𝗶𝘁𝗶𝗼𝗻: ${description.charAt(0).toUpperCase() + description.slice(1)}\n` +
            `🌡️ 𝗧𝗲𝗺𝗽𝗲𝗿𝗮𝘁𝘂𝗿𝗲: ${temperature}°C\n` +
            `🤔 𝗙𝗲𝗲𝗹𝘀 𝗹𝗶𝗸𝗲: ${feelsLike}°C\n` +
            `💧 𝗛𝘂𝗺𝗶𝗱𝗶𝘁𝘆: ${humidity}%\n` +
            `💨 𝗪𝗶𝗻𝗱 𝗦𝗽𝗲𝗲𝗱: ${windSpeed} m/s\n` +
            `👁️ 𝗩𝗶𝘀𝗶𝗯𝗶𝗹𝗶𝘁𝘆: ${visibility} km\n` +
            `📊 𝗣𝗿𝗲𝘀𝘀𝘂𝗿𝗲: ${pressure} hPa\n` +
            `🌅 𝗦𝘂𝗻𝗿𝗶𝘀𝗲: ${sunrise}\n` +
            `🌇 𝗦𝘂𝗻𝘀𝗲𝘁: ${sunset}\n` +
            `━━━━━━━━━━━━━━━━━━`;

        if (weatherPhotoUrl) {
            const photoResponse = await axios.get(weatherPhotoUrl, { responseType: 'stream' });
            const photoPath = path.join(__dirname, `weather_${Date.now()}.jpg`);
            
            const writer = fs.createWriteStream(photoPath);
            photoResponse.data.pipe(writer);
            
            writer.on('finish', () => {
                api.sendMessage({
                    body: weatherMessage,
                    attachment: fs.createReadStream(photoPath)
                }, threadID, () => {
                    fs.unlinkSync(photoPath);
                }, messageID);
            });
        } else {
            api.sendMessage(weatherMessage, threadID, messageID);
        }

    } catch (error) {
        console.error(error);
        
        // Fallback to alternative free API
        try {
            await fallbackWeatherAPI(api, event, city);
        } catch (fallbackError) {
            api.sendMessage(
                "❌ 𝗪𝗘𝗔𝗧𝗛𝗘𝗥 𝗘𝗥𝗥𝗢𝗥\n━━━━━━━━━━━━━━━━━━\nFailed to get weather information. Please try again later.",
                threadID, messageID
            );
        }
    }
};

async function getWeatherPhoto(condition, city) {
    const conditionMap = {
        'clear': 'sunny',
        'clouds': 'cloudy',
        'rain': 'rainy',
        'snow': 'snow',
        'thunderstorm': 'storm',
        'drizzle': 'drizzle',
        'mist': 'fog',
        'smoke': 'fog',
        'haze': 'fog',
        'dust': 'fog',
        'fog': 'fog',
        'sand': 'fog',
        'ash': 'fog',
        'squall': 'storm',
        'tornado': 'storm'
    };

    const photoType = conditionMap[condition] || 'weather';
    
    // Using Unsplash free API for weather photos
    const unsplashUrl = `https://source.unsplash.com/600x400/?${photoType}-weather,${city}`;
    return unsplashUrl;
}

async function fallbackWeatherAPI(api, event, city) {
    const { threadID, messageID } = event;
    
    // Alternative free weather API - WeatherAPI
    const alternativeUrl = `https://api.weatherapi.com/v1/current.json?key=4f9a5b7a1a1e4f5c8a5172209230712&q=${encodeURIComponent(city)}&aqi=no`;
    
    try {
        const response = await axios.get(alternativeUrl);
        const data = response.data;
        
        const weatherMessage = 
            `🌤️ 𝗪𝗘𝗔𝗧𝗛𝗘𝗥 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡\n━━━━━━━━━━━━━━━━━━\n` +
            `📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${data.location.name}, ${data.location.country}\n` +
            `📊 𝗖𝗼𝗻𝗱𝗶𝘁𝗶𝗼𝗻: ${data.current.condition.text}\n` +
            `🌡️ 𝗧𝗲𝗺𝗽𝗲𝗿𝗮𝘁𝘂𝗿𝗲: ${data.current.temp_c}°C\n` +
            `🤔 𝗙𝗲𝗲𝗹𝘀 𝗹𝗶𝗸𝗲: ${data.current.feelslike_c}°C\n` +
            `💧 𝗛𝘂𝗺𝗶𝗱𝗶𝘁𝘆: ${data.current.humidity}%\n` +
            `💨 𝗪𝗶𝗻𝗱 𝗦𝗽𝗲𝗲𝗱: ${data.current.wind_kph} km/h\n` +
            `👁️ 𝗩𝗶𝘀𝗶𝗯𝗶𝗹𝗶𝘁𝘆: ${data.current.vis_km} km\n` +
            `📊 𝗣𝗿𝗲𝘀𝘀𝘂𝗿𝗲: ${data.current.pressure_mb} mb\n` +
            `━━━━━━━━━━━━━━━━━━`;

        // Get weather photo
        const condition = data.current.condition.text.toLowerCase();
        const weatherPhotoUrl = await getWeatherPhoto(condition, city);

        if (weatherPhotoUrl) {
            const photoResponse = await axios.get(weatherPhotoUrl, { responseType: 'stream' });
            const photoPath = path.join(__dirname, `weather_${Date.now()}.jpg`);
            
            const writer = fs.createWriteStream(photoPath);
            photoResponse.data.pipe(writer);
            
            writer.on('finish', () => {
                api.sendMessage({
                    body: weatherMessage,
                    attachment: fs.createReadStream(photoPath)
                }, threadID, () => {
                    fs.unlinkSync(photoPath);
                }, messageID);
            });
        } else {
            api.sendMessage(weatherMessage, threadID, messageID);
        }
        
    } catch (error) {
        throw error;
    }
}