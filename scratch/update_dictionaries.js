import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const enPath = path.resolve(__dirname, '../src/i18n/translations/en.js');
const hiPath = path.resolve(__dirname, '../src/i18n/translations/hi.js');
const knPath = path.resolve(__dirname, '../src/i18n/translations/kn.js');

const en = (await import('../src/i18n/translations/en.js')).default;
const hi = (await import('../src/i18n/translations/hi.js')).default;
const kn = (await import('../src/i18n/translations/kn.js')).default;

// 1. New keys dictionary
const additions = {
  common: {
    academicDisclaimerNotice: {
      en: "Academic Demonstration Notice:",
      hi: "शैक्षणिक प्रदर्शन सूचना:",
      kn: "ಶೈಕ್ಷಣಿಕ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾಹಿತಿ:"
    },
    academicDisclaimerText: {
      en: "This application is an academic Digital Twin prototype. Sensor readings and scenario outputs shown in Demo Mode are simulated for demonstration purposes and should not be used as direct agronomic prescriptions.",
      hi: "यह एप्लिकेशन एक शैक्षणिक डिजिटल ट्विन प्रोटोटाइप है। डेमो मोड में दिखाए गए सेंसर रीडिंग और परिदृश्य केवल प्रदर्शन के लिए हैं और इन्हें प्रत्यक्ष कृषि नुस्खे के रूप में उपयोग नहीं किया जाना चाहिए।",
      kn: "ಈ ಅಪ್ಲಿಕೇಶನ್ ಶೈಕ್ಷಣಿಕ ಡಿಜಿಟಲ್ ಟ್ವಿನ್ ಮಾದರಿಯಾಗಿದೆ. ಡೆಮೊ ಮೋಡ್‌ನಲ್ಲಿ ತೋರಿಸಲಾದ ಸೆನ್ಸಾರ್ ರೀಡಿಂಗ್‌ಗಳು ಕೇವಲ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಮಾತ್ರವಾಗಿದ್ದು, ನೇರ ಕೃಷಿ ನಿರ್ದೇಶನಗಳಾಗಿ ಬಳಸಬಾರದು."
    },
    selectCrop: {
      en: "Select Crop",
      hi: "फसल चुनें",
      kn: "ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ"
    },
    allClear: {
      en: "All Clear",
      hi: "सब सुरक्षित है",
      kn: "ಎಲ್ಲವೂ ಸುರಕ್ಷಿತ"
    }
  },
  nav: {
    smartAgriculture: {
      en: "Smart Agriculture",
      hi: "स्मार्ट कृषि",
      kn: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿ"
    },
    farmMenu: {
      en: "FARM MENU",
      hi: "कृषि मेनू",
      kn: "ಕೃಷಿ ಮೆನು"
    },
    fieldTwinAndHealth: {
      en: "Field Twin & Health",
      hi: "फील्ड ट्विन व फसल स्वास्थ्य",
      kn: "ಡಿಜಿಟಲ್ ಟ್ವಿನ್ ಮತ್ತು ಬೆಳೆ ಆರೋಗ್ಯ"
    },
    insightsAndSimulation: {
      en: "Insights & Simulation",
      hi: "अनुमान व सिमुलेशन",
      kn: "ಮುನ್ಸೂಚನೆ ಮತ್ತು ಸಿಮ್ಯುಲೇಶನ್"
    },
    toolsAndConfig: {
      en: "Tools & Configuration",
      hi: "उपकरण व सेटिंग्स",
      kn: "ಉಪಕರಣಗಳು ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್"
    },
    addNewFieldMap: {
      en: "+ Add New Field on Map",
      hi: "+ नक्शे पर नया खेत जोड़ें",
      kn: "+ ನಕ್ಷೆಯಲ್ಲಿ ಹೊಸ ಹೊಲ ಸೇರಿಸಿ"
    }
  },
  home: {
    myFarm: {
      en: "My Farm",
      hi: "मेरा खेत",
      kn: "ನನ್ನ ಹೊಲ"
    }
  },
  myFields: {
    noFieldsAdded: {
      en: "No Fields Added Yet",
      hi: "अभी तक कोई खेत नहीं जोड़ा गया",
      kn: "ಇನ್ನೂ ಯಾವುದೇ ಹೊಲಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ"
    },
    noFieldsDesc: {
      en: "Add your agricultural field boundary on the map to activate your digital twin and irrigation advice.",
      hi: "डिजिटल ट्विन और सिंचाई सलाह शुरू करने के लिए नक्शे पर अपने खेत की सीमा बनाएं।",
      kn: "ಡಿಜಿಟಲ್ ಟ್ವಿನ್ ಮತ್ತು ನೀರಾವರಿ ಸಲಹೆ ಆರಂಭಿಸಲು ನಕ್ಷೆಯಲ್ಲಿ ನಿಮ್ಮ ಹೊಲದ ಗಡಿ ಗುರುತಿಸಿ."
    },
    selectFieldOnMap: {
      en: "Select Your Field on Map",
      hi: "नक्शे पर अपना खेत चुनें",
      kn: "ನಕ್ಷೆಯಲ್ಲಿ ನಿಮ್ಮ ಹೊಲವನ್ನು ಆಯ್ಕೆಮಾಡಿ"
    },
    gpsCoordinates: {
      en: "GPS:",
      hi: "जीपीएस (GPS):",
      kn: "ಜಿಪಿಎಸ್ (GPS):"
    },
    zoneMoisture: {
      en: "Zone Moisture:",
      hi: "ज़ोन की नमी:",
      kn: "ವಲಯಗಳ ತೇವಾಂಶ:"
    },
    notConfigured: {
      en: "Not Configured",
      hi: "सेट नहीं किया गया",
      kn: "ಹೊಂದಿಸಲಾಗಿಲ್ಲ"
    },
    allZonesAdequate: {
      en: "All 4 Field Zones",
      hi: "खेत के चारों ज़ोन",
      kn: "ಹೊಲದ ಎಲ್ಲಾ 4 ವಲಯಗಳು"
    },
    villagePlaceholder: {
      en: "e.g., Thondamuthur Village",
      hi: "उदा. थोंडामुथुर गांव",
      kn: "ಉದಾ. ತೊಂಡಮುತ್ತೂರು ಗ್ರಾಮ"
    }
  },
  water: {
    virtualDemoNotice: {
      en: "Virtual Demonstration:",
      hi: "वर्चुअल प्रदर्शन:",
      kn: "ವರ್ಚುವಲ್ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ:"
    },
    rootDepth: {
      en: "• Root Depth (Zr): 0.50 m",
      hi: "• जड़ की गहराई (Zr): 0.50 मी",
      kn: "• ಬೇರಿನ ಆಳ (Zr): 0.50 ಮೀ"
    },
    waterStorageStressCapacities: {
      en: "Water Storage & Stress Capacities:",
      hi: "जल भंडारण व तनाव क्षमताएं:",
      kn: "ನೀರಿನ ಸಂಗ್ರಹ ಮತ್ತು ಒತ್ತಡದ ಸಾಮರ್ಥ್ಯಗಳು:"
    },
    scenarioA: {
      en: "Scenario A (Rain {rain} mm):",
      hi: "परिदृश्य A (बारिश {rain} मिमी):",
      kn: "ಸನ್ನಿವೇಶ A (ಮಳೆ {rain} ಮಿಮೀ):"
    },
    scenarioB: {
      en: "Scenario B (Zero Rain):",
      hi: "परिदृश्य B (शून्य बारिश):",
      kn: "ಸನ್ನಿವೇಶ B (ಮಳೆಯಿಲ್ಲ):"
    },
    scenarioComparison: {
      en: "5-Day Scenario Comparison (Forecast-Rain vs. Dry Baseline)",
      hi: "5-दिवसीय परिदृश्य तुलना (बारिश बनाम सूखा)",
      kn: "5 ದಿನಗಳ ಸನ್ನಿವೇಶ ಹೋಲಿಕೆ (ಮಳೆ ಮುನ್ಸೂಚನೆ vs ಒಣ ವಾತಾವರಣ)"
    },
    offlineNotice: {
      en: "Weather forecast is offline. Multi-day rain scenarios are paused. Operating in in-situ moisture mode.",
      hi: "मौसम पूर्वानुमान ऑफ़लाइन है। बहु-दिवसीय बारिश परिदृश्य रुके हुए हैं। इन-सिटू नमी मोड में काम जारी है।",
      kn: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ. ಬಹು-ದಿನದ ಮಳೆ ಸನ್ನಿವೇಶಗಳನ್ನು ನಿಲ್ಲಿಸಲಾಗಿದೆ. ನೇರ ಮಣ್ಣಿನ ತೇವಾಂಶ ಮೋಡ್‌ನಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ."
    },
    soilConstants: {
      en: "Soil Constants",
      hi: "मिट्टी के स्थिरांक",
      kn: "ಮಣ್ಣಿನ ನಿಯತಾಂಕಗಳು"
    }
  },
  weather: {
    faoEt0: {
      en: "FAO-56 ET₀:",
      hi: "FAO-56 ET₀:",
      kn: "FAO-56 ET₀:"
    },
    cropEtc: {
      en: "Crop ETc:",
      hi: "फसल ETc:",
      kn: "ಬೆಳೆ ETc:"
    },
    condition: {
      en: "Condition",
      hi: "मौसम की स्थिति",
      kn: "ಹವಾಮಾನ ಸ್ಥಿತಿ"
    },
    next8Hours: {
      en: "Next 8 Hours",
      hi: "अगले 8 घंटे",
      kn: "ಮುಂದಿನ 8 ಗಂಟೆಗಳು"
    },
    dailyPrediction: {
      en: "Daily Weather Prediction",
      hi: "दैनिक मौसम पूर्वानुमान",
      kn: "ದೈನಂದಿನ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ"
    },
    rainAlert: {
      en: "Rain Alert",
      hi: "बारिश का अलर्ट",
      kn: "ಮಳೆ ಮುನ್ಸೂಚನೆ"
    },
    drySkies: {
      en: "Dry Skies",
      hi: "मौसम सूखा",
      kn: "ಒಣ ಹವೆ"
    },
    liveForecastBadge: {
      en: "LIVE NWP FORECAST",
      hi: "लाइव मौसम पूर्वानुमान",
      kn: "ಲೈವ್ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ"
    },
    cachedForecastBadge: {
      en: "CACHED FORECAST ({hours}h)",
      hi: "सहेजा गया पूर्वानुमान ({hours} घंटे)",
      kn: "ಸಂಗ್ರಹಿತ ಮುನ್ಸೂಚನೆ ({hours} ಗಂ)"
    },
    offlineBadge: {
      en: "WEATHER SERVICE OFFLINE",
      hi: "मौसम सेवा ऑफ़लाइन",
      kn: "ಹವಾಮಾನ ಸೇವೆ ಆಫ್‌ಲೈನ್"
    },
    liveWeather: {
      en: "LIVE WEATHER",
      hi: "लाइव मौसम",
      kn: "ಲೈವ್ ಹವಾಮಾನ"
    },
    weatherConditions: {
      clearSky: {
        en: "Clear Sky",
        hi: "साफ आसमान",
        kn: "ಸ್ವಚ್ಛ ಆಕಾಶ"
      },
      mainlyClear: {
        en: "Mainly Clear",
        hi: "मुख्यतः साफ",
        kn: "ಹೆಚ್ಚಾಗಿ ಸ್ವಚ್ಛ"
      },
      partlyCloudy: {
        en: "Partly Cloudy",
        hi: "आंशिक बादल",
        kn: "ಭಾಗಶಃ ಮೋಡ"
      },
      overcast: {
        en: "Overcast",
        hi: "घने बादल",
        kn: "ಮೋಡ ಕವಿದ ವಾತಾವರಣ"
      },
      foggy: {
        en: "Foggy",
        hi: "कोहरा",
        kn: "ಮಂಜು ಮುಸುಕಿದ ವಾತಾವರಣ"
      },
      lightDrizzle: {
        en: "Light Drizzle",
        hi: "हल्की बूंदाबांदी",
        kn: "ತೆಳು ತುಂತುರು ಮಳೆ"
      },
      slightRain: {
        en: "Slight Rain",
        hi: "हल्की बारिश",
        kn: "ಹಗುರ ಮಳೆ"
      },
      moderateRain: {
        en: "Moderate Rain",
        hi: "मध्यम बारिश",
        kn: "ಸಾಧಾರಣ ಮಳೆ"
      },
      heavyRain: {
        en: "Heavy Rain",
        hi: "भारी बारिश",
        kn: "ಭಾರೀ ಮಳೆ"
      },
      rainShowers: {
        en: "Rain Showers",
        hi: "बारिश की फुहारें",
        kn: "ಮಳೆಯ ಸಿಂಚನ"
      },
      thunderstorm: {
        en: "Thunderstorm",
        hi: "गरज के साथ बारिश",
        kn: "ಗುಡುಗು ಸಹಿತ ಮಳೆ"
      },
      unavailable: {
        en: "Weather Unavailable",
        hi: "मौसम की जानकारी उपलब्ध नहीं",
        kn: "ಹವಾಮಾನ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ"
      }
    },
    days: {
      today: {
        en: "Today",
        hi: "आज",
        kn: "ಇಂದು"
      },
      tomorrow: {
        en: "Tomorrow",
        hi: "कल",
        kn: "ನಾಳೆ"
      },
      mon: {
        en: "Mon",
        hi: "सोम",
        kn: "ಸೋಮ"
      },
      tue: {
        en: "Tue",
        hi: "मंगल",
        kn: "ಮಂಗಳ"
      },
      wed: {
        en: "Wed",
        hi: "बुध",
        kn: "ಬುಧ"
      },
      thu: {
        en: "Thu",
        hi: "गुरु",
        kn: "ಗುರು"
      },
      fri: {
        en: "Fri",
        hi: "शुक्र",
        kn: "ಶುಕ್ರ"
      },
      sat: {
        en: "Sat",
        hi: "शनि",
        kn: "ಶನಿ"
      },
      sun: {
        en: "Sun",
        hi: "रवि",
        kn: "ಭಾನು"
      }
    }
  },
  alerts: {
    severityCritical: {
      en: "CRITICAL",
      hi: "गंभीर",
      kn: "ಗಂಭೀರ"
    },
    severityActionNeeded: {
      en: "ACTION NEEDED",
      hi: "कार्रवाई आवश्यक",
      kn: "ಕ್ರಮ ಅಗತ್ಯ"
    },
    severityInfo: {
      en: "INFO",
      hi: "सूचना",
      kn: "ಮಾಹಿತಿ"
    },
    markSeen: {
      en: "Mark Seen",
      hi: "देखा गया चिह्नित करें",
      kn: "ನೋಡಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ"
    },
    markResolved: {
      en: "Mark Resolved",
      hi: "हल हुआ चिह्नित करें",
      kn: "ಪರಿಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ"
    },
    allClearPill: {
      en: "All Clear",
      hi: "सब ठीक है",
      kn: "ಎಲ್ಲವೂ ಸುರಕ್ಷಿತ"
    },
    allAlerts: {
      en: "All Alerts",
      hi: "सभी अलर्ट",
      kn: "ಎಲ್ಲಾ ಎಚ್ಚರಿಕೆಗಳು"
    },
    waterCategory: {
      en: "Water Deficit",
      hi: "पानी की कमी",
      kn: "ನೀರಿನ ಕೊರತೆ"
    },
    plantCategory: {
      en: "Plant Health",
      hi: "फसल स्वास्थ्य",
      kn: "ಬೆಳೆ ಆರೋಗ್ಯ"
    },
    weatherCategory: {
      en: "Weather",
      hi: "मौसम",
      kn: "ಹವಾಮಾನ"
    }
  },
  fieldTwin: {
    digitalTwin: {
      en: "Digital Twin:",
      hi: "डिजिटल ट्विन:",
      kn: "ಡಿಜಿಟಲ್ ಟ್ವಿನ್:"
    },
    fieldTwin3D: {
      en: "3D Field Twin:",
      hi: "3D फील्ड ट्विन:",
      kn: "3D ಫೀಲ್ಡ್ ಟ್ವಿನ್:"
    },
    hovering: {
      en: "Hovering:",
      hi: "निगरानी:",
      kn: "ವೀಕ್ಷಣೆ:"
    },
    layers3D: {
      en: "3D Layers",
      hi: "3D परतें",
      kn: "3D ಪದರಗಳು"
    },
    canopyMode2D: {
      en: "(2D Canopy Mode)",
      hi: "(2D कैनोपी मोड)",
      kn: "(2D ನಕ್ಷೆ ಮೋಡ್)"
    },
    demoQuadrants: {
      en: "4 Precision Zones (Assumed Demo Quadrants)",
      hi: "4 सटीक ज़ोन (प्रदर्शन भूखंड)",
      kn: "4 ನಿಖರ ವಲಯಗಳು (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಭಾಗಗಳು)"
    },
    lastStreamed: {
      en: "Last Streamed:",
      hi: "अंतिम डेटा:",
      kn: "ಕೊನೆಯ ವಾಚನ:"
    },
    justNowLive: {
      en: "Just now (Live)",
      hi: "अभी-अभी (लाइव)",
      kn: "ಈಗಷ್ಟೇ (ಲೈವ್)"
    },
    irrigationAdvisory: {
      en: "Irrigation Advisory:",
      hi: "सिंचाई सलाह:",
      kn: "ನೀರಾವರಿ ಸಲಹೆ:"
    }
  },
  whatIf: {
    whatCouldHappen: {
      en: "WHAT COULD HAPPEN",
      hi: "क्या हो सकता है",
      kn: "ಏನಾಗಬಹುದು"
    },
    scenarioTitle: {
      en: "Scenario: {title}",
      hi: "परिदृश्य: {title}",
      kn: "ಸನ್ನಿವೇಶ: {title}"
    },
    temperatureShift: {
      en: "Temperature Shift",
      hi: "तापमान में बदलाव",
      kn: "ತಾಪಮಾನದ ಬದಲಾವಣೆ"
    },
    rainAmount: {
      en: "Rain Amount",
      hi: "बारिश की मात्रा",
      kn: "ಮಳೆಯ ಪ್ರಮಾಣ"
    },
    farmerAdvice: {
      en: "Advice for Farmer:",
      hi: "किसान के लिए सलाह:",
      kn: "ರೈತರಿಗೆ ಸಲಹೆ:"
    },
    effectStable: {
      en: "Stable",
      hi: "स्थिर",
      kn: "ಸ್ಥಿರ"
    },
    effectFasterDrying: {
      en: "Faster Drying",
      hi: "तेजी से सूखना",
      kn: "ವೇಗವಾಗಿ ಒಣಗುವುದು"
    },
    effectDecreasesFaster: {
      en: "Decreases Faster",
      hi: "तेजी से कमी",
      kn: "ವೇಗವಾಗಿ ಇಳಿಕೆ"
    },
    effectRecharged: {
      en: "Recharged / High",
      hi: "भरपूर नमी",
      kn: "ಗರಿಷ್ಠ ತೇವಾಂಶ"
    },
    waterNeedNormal: {
      en: "Normal",
      hi: "सामान्य",
      kn: "ಸಾಮಾನ್ಯ"
    },
    waterNeedMediumHigh: {
      en: "Medium-High",
      hi: "मध्यम से अधिक",
      kn: "ಮಧ್ಯಮದಿಂದ ಹೆಚ್ಚು"
    },
    waterNeedHigh: {
      en: "High",
      hi: "अधिक",
      kn: "ಹೆಚ್ಚು"
    },
    waterNeedNone: {
      en: "None (No watering needed)",
      hi: "कोई नहीं (सिंचाई की आवश्यकता नहीं)",
      kn: "ಇಲ್ಲ (ನೀರುಣಿಸುವ ಅಗತ್ಯವಿಲ್ಲ)"
    },
    cropEffectHealthy: {
      en: "Good / Healthy",
      hi: "उत्तम / स्वस्थ",
      kn: "ಉತ್ತಮ / ಆರೋಗ್ಯಕರ"
    },
    cropEffectFrequentCheck: {
      en: "May need more frequent checks",
      hi: "बार-बार निगरानी की आवश्यकता हो सकती है",
      kn: "ಹೆಚ್ಚು ಬಾರಿ ಗಮನಿಸಬೇಕಾಗಬಹುದು"
    },
    cropEffectStressIncrease: {
      en: "Stress may increase",
      hi: "तनाव बढ़ सकता है",
      kn: "ಒತ್ತಡ ಹೆಚ್ಚಾಗಬಹುದು"
    },
    cropEffectPlentyWater: {
      en: "Plenty of water",
      hi: "पर्याप्त पानी",
      kn: "ಸಾಕಷ್ಟು ನೀರು"
    }
  },
  whatMayHappen: {
    outlookOtherZones: {
      en: "Outlook for Other Zones",
      hi: "अन्य ज़ोन की स्थिति व अनुमान",
      kn: "ಇತರ ವಲಯಗಳ ಮುಂದಿನ ಅಂದಾಜು"
    },
    soilWaterIs: {
      en: "Soil water is {status} at {moisture}% VWC. {action}",
      hi: "मिट्टी की नमी {moisture}% पर {status} है। {action}",
      kn: "ಮಣ್ಣಿನ ತೇವಾಂಶ {moisture}% ನಲ್ಲಿ {status} ಆಗಿದೆ. {action}"
    },
    statusOptimal: {
      en: "optimal",
      hi: "पर्याप्त",
      kn: "ಉತ್ತಮ"
    },
    statusModerate: {
      en: "moderate",
      hi: "मध्यम",
      kn: "ಸಾಧಾರಣ"
    },
    statusLow: {
      en: "low",
      hi: "कम",
      kn: "ಕಡಿಮೆ"
    },
    actionIrrigationReq: {
      en: "Irrigation required.",
      hi: "सिंचाई की आवश्यकता है।",
      kn: "ನೀರು ಹಾಯಿಸುವುದು ಅಗತ್ಯ."
    },
    actionAdequateMonitor: {
      en: "Adequate for now, monitor tomorrow.",
      hi: "अभी पर्याप्त है, कल फिर जांचें।",
      kn: "ಸದ್ಯಕ್ಕೆ ಸಾಕಾಗಿದೆ, ನಾಳೆ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ."
    },
    actionNoWateringToday: {
      en: "No watering needed today.",
      hi: "आज सिंचाई की जरूरत नहीं है।",
      kn: "ಇಂದು ನೀರು ಹಾಯಿಸುವ ಅಗತ್ಯವಿಲ್ಲ."
    }
  },
  reports: {
    fieldReportTitle: {
      en: "AgriTwin Field Report",
      hi: "एग्रीट्विन खेत रिपोर्ट",
      kn: "ಅಗ್ರಿಟ್ವಿನ್ ಕೃಷಿ ವರದಿ"
    },
    date: {
      en: "Date:",
      hi: "दिनांक:",
      kn: "ದಿನಾಂಕ:"
    },
    time: {
      en: "Time:",
      hi: "समय:",
      kn: "ಸಮಯ:"
    },
    statusUpdated: {
      en: "Status: Updated",
      hi: "स्थिति: अद्यतन",
      kn: "ಸ್ಥಿತಿ: ನವೀಕೃತ"
    },
    fieldAverageAcrossZones: {
      en: "Field Average Across Four Zones:",
      hi: "चारों ज़ोन की औसत नमी:",
      kn: "ನಾಲ್ಕು ವಲಯಗಳ ಸರಾಸರಿ ತೇವಾಂಶ:"
    },
    targetArea: {
      en: "Target Area:",
      hi: "सिंचित क्षेत्र:",
      kn: "ಗುರಿ ಪ್ರದೇಶ:"
    },
    netDeficit: {
      en: "Net Deficit:",
      hi: "शुद्ध पानी की कमी:",
      kn: "ನಿವ್ವಳ ನೀರಿನ ಕೊರತೆ:"
    },
    netWaterReq: {
      en: "Net Water Req:",
      hi: "आवश्यक शुद्ध पानी:",
      kn: "ಅಗತ್ಯವಿರುವ ನಿವ್ವಳ ನೀರು:"
    },
    estimatedPumpRuntime: {
      en: "Estimated Pump Runtime:",
      hi: "अनुमानित पंप चलने का समय:",
      kn: "ಅಂದಾಜು ಪಂಪ್ ಚಾಲನಾ ಸಮಯ:"
    },
    tagline: {
      en: "AgriTwin Platform • Simple Farming Decisions from Smart Field Data",
      hi: "एग्रीट्विन प्लेटफॉर्म • खेत के सटीक डेटा से किसानों के सरल निर्णय",
      kn: "ಅಗ್ರಿಟ್ವಿನ್ ವೇದಿಕೆ • ನಿಖರ ಕೃಷಿ ಮಾಹಿತಿಯಿಂದ ರೈತರ ಸುಲಭ ನಿರ್ಧಾರಗಳು"
    }
  },
  sensorData: {
    colTime: {
      en: "Time",
      hi: "समय",
      kn: "ಸಮಯ"
    },
    colSensor: {
      en: "Sensor",
      hi: "सेंसर",
      kn: "ಸಂವೇದಕ"
    },
    colZone: {
      en: "Zone",
      hi: "ज़ोन",
      kn: "ವಲಯ"
    },
    colReading: {
      en: "Reading",
      hi: "रीडिंग",
      kn: "ವಾಚನ"
    },
    colValue: {
      en: "Value",
      hi: "मान",
      kn: "ಮೌಲ್ಯ"
    },
    liveStreamBadge: {
      en: "LIVE STREAM",
      hi: "लाइव स्ट्रीम",
      kn: "ಲೈವ್ ಸ್ಟ್ರೀಮ್"
    },
    simulatedNotice: {
      en: "SIMULATED SENSOR DATA — DEMONSTRATION MODE",
      hi: "अनुमानित सेंसर डेटा — केवल प्रदर्शन हेतु",
      kn: "ಅಂದಾಜು ಸಂವೇದಕ ಮಾಹಿತಿ — ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಮಾತ್ರ"
    }
  },
  settings: {
    demoThresholdsTitle: {
      en: "Configurable Demonstration Thresholds",
      hi: "कॉन्फ़िगर करने योग्य प्रदर्शन सीमाएं",
      kn: "ಹೊಂದಿಸಬಹುದಾದ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಿತಿಗಳು"
    },
    demoThresholdsDesc: {
      en: "Controls GOOD, MODERATE and LOW status classification across all screens",
      hi: "सभी स्क्रीन पर अच्छा, मध्यम और कम स्थिति का वर्गीकरण नियंत्रित करता है",
      kn: "ಎಲ್ಲಾ ಪರದೆಗಳಲ್ಲಿ ಉತ್ತಮ, ಮಧ್ಯಮ ಮತ್ತು ಕಡಿಮೆ ಸ್ಥಿತಿಯ ವರ್ಗೀಕರಣವನ್ನು ನಿಯಂತ್ರಿಸುತ್ತದೆ"
    },
    optimalThresholdLabel: {
      en: "Optimal Soil Moisture Threshold (GOOD >)",
      hi: "उत्तम मिट्टी नमी सीमा (अच्छा >)",
      kn: "ಉತ್ತಮ ಮಣ್ಣಿನ ತೇವಾಂಶ ಮಿತಿ (ಉತ್ತಮ >)"
    },
    moderateThresholdLabel: {
      en: "Moderate Moisture Depletion (MODERATE >)",
      hi: "मध्यम नमी स्तर (मध्यम >)",
      kn: "ಮಧ್ಯಮ ತೇವಾಂಶ ಮಟ್ಟ (ಮಧ್ಯಮ >)"
    },
    criticalThresholdLabel: {
      en: "Critical Low Moisture Threshold (CRITICAL <)",
      hi: "गंभीर कम नमी सीमा (गंभीर <)",
      kn: "ಗಂಭೀರ ಕಡಿಮೆ ತೇವಾಂಶ ಮಿತಿ (ಗಂಭೀರ <)"
    },
    heatwaveWarningLabel: {
      en: "Thermal Heatwave Warning Threshold (>)",
      hi: "गर्मी / लू चेतावनी सीमा (>)",
      kn: "ಬಿಸಿಗಾಳಿ ಎಚ್ಚರಿಕೆ ಮಿತಿ (>)"
    },
    fieldConfigTitle: {
      en: "Active Field Geographic & Agronomic Configuration",
      hi: "सक्रिय खेत की भौगोलिक व कृषि सेटिंग्स",
      kn: "ಆಯ್ಕೆಯಾದ ಹೊಲದ ಭೌಗೋಳಿಕ ಮತ್ತು ಕೃಷಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳು"
    },
    fieldConfigDesc: {
      en: "Configure crop, soil matrix texture, and optional irrigation flow rate",
      hi: "फसल, मिट्टी का प्रकार और सिंचाई पंप प्रवाह दर सेट करें",
      kn: "ಬೆಳೆ, ಮಣ್ಣಿನ ಪ್ರಕಾರ ಮತ್ತು ನೀರಾವರಿ ಪಂಪ್ ಹರಿವಿನ ದರವನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ"
    },
    fieldNameLabel: {
      en: "Field Name",
      hi: "खेत का नाम",
      kn: "ಹೊಲದ ಹೆಸರು"
    },
    cultivatedCropLabel: {
      en: "Cultivated Crop",
      hi: "उगाई जाने वाली फसल",
      kn: "ಬೆಳೆಯುವ ಬೆಳೆ"
    },
    soilTextureLabel: {
      en: "Soil Texture Model",
      hi: "मिट्टी का प्रकार",
      kn: "ಮಣ್ಣಿನ ವಿಧ"
    },
    growthStageLabel: {
      en: "Growth Stage",
      hi: "फसल वृद्धि अवस्था",
      kn: "ಬೆಳೆಯ ಬೆಳವಣಿಗೆಯ ಹಂತ"
    },
    flowRateLabel: {
      en: "Pump Flow Rate (Liters/Hour)",
      hi: "पंप प्रवाह दर (लीटर/घंटा)",
      kn: "ಪಂಪ್ ಹರಿವಿನ ದರ (ಲೀಟರ್/ಗಂಟೆ)"
    },
    resetDefaults: {
      en: "Reset Defaults",
      hi: "डिफ़ॉल्ट पर रीसेट करें",
      kn: "ಮೊದಲಿನ ಸ್ಥಿತಿಗೆ ಮರುಹೊಂದಿಸಿ"
    }
  },
  selectField: {
    searchingPlaceholder: {
      en: "Searching locations across farms, campuses, landmarks & PIN codes...",
      hi: "खेत, गांव, स्थान और पिन कोड खोजें...",
      kn: "ಹೊಲ, ಗ್ರಾಮ, ಸ್ಥಳ ಮತ್ತು ಪಿನ್ ಕೋಡ್ ಹುಡುಕಿ..."
    },
    clickSelectLocation: {
      en: "Click 'Select Location' to center map",
      hi: "नक्शे को केंद्रित करने के लिए 'स्थान चुनें' पर क्लिक करें",
      kn: "ನಕ್ಷೆಯನ್ನು ಮಧ್ಯಕ್ಕೆ ತರಲು 'ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ' ಕ್ಲಿಕ್ ಮಾಡಿ"
    },
    selectLocationBtn: {
      en: "Select Location",
      hi: "स्थान चुनें",
      kn: "ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ"
    },
    centerBtn: {
      en: "Center",
      hi: "केंद्रित करें",
      kn: "ಮಧ್ಯಕ್ಕೆ ತನ್ನಿ"
    }
  },
  fieldMonitor: {
    demoQuadrantsNotice: {
      en: "4 equal quadrants (Assumed demonstration areas • not surveyed boundaries)",
      hi: "4 समान ज़ोन (अनुमानित प्रदर्शन क्षेत्र • वास्तविक सर्वेक्षण सीमाएं नहीं)",
      kn: "4 ಸಮಾನ ವಲಯಗಳು (ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಊಹಿಸಿದ ಭಾಗಗಳು • ಅಳತೆ ಮಾಡಿದ ಗಡಿಗಳಲ್ಲ)"
    }
  },
  crops: {
    groundnut: {
      en: "Groundnut",
      hi: "मूंगफली",
      kn: "ಕಡಲೆಕಾಯಿ"
    },
    pulses: {
      en: "Pulses (Lentils)",
      hi: "दालें (दलहन)",
      kn: "ದ್ವಿದಳ ಧಾನ್ಯಗಳು / ಬೇಳೆಕಾಳುಗಳು"
    },
    vegetables: {
      en: "Vegetables",
      hi: "सब्जियां",
      kn: "ತರಕಾರಿಗಳು"
    }
  }
};

// 2. Refinements to existing translations in hi & kn for more natural farmer language
const refinements = {
  hi: {
    home: {
      waterOutlookBtn: "सिंचाई स्थिति व सलाह",
      fieldMonitorBtn: "खेत निगरानी",
      reportsBtn: "खेत रिपोर्ट"
    },
    alerts: {
      criticalWiltMsg: "मिट्टी की नमी 8.0% मुरझाने के बिंदु (Wilting Point) के करीब या नीचे है। फसल को तत्काल पानी की आवश्यकता है।",
      showingEvents: "अलर्ट व सूचनाएं दिखाई जा रही हैं"
    },
    whatMayHappen: {
      zone2Outlook: "ज़ोन 2 की स्थिति व अनुमान",
      demonstrationOutlookNotice: "सिमुलेटेड रुझानों पर आधारित • केवल प्रदर्शन हेतु"
    }
  },
  kn: {
    home: {
      fieldMonitorBtn: "ಹೊಲದ ನಿಗಾ",
      reportsBtn: "ಕೃಷಿ ವರದಿಗಳು"
    },
    alerts: {
      criticalWiltMsg: "ಮಣ್ಣಿನ ತೇವಾಂಶವು 8.0% ಶಾಶ್ವತ ಬಾಡುವ ಮಟ್ಟಕ್ಕೆ (Wilting Point) ತಲುಪಿದೆ ಅಥವಾ ಕಡಿಮೆಯಾಗಿದೆ. ಬೆಳೆ ತೀವ್ರ ಬಾಡುವಿಕೆಯ ಅಪಾಯದಲ್ಲಿದೆ.",
      showingEvents: "ಎಚ್ಚರಿಕೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ"
    },
    whatMayHappen: {
      zone2Outlook: "ವಲಯ 2 ರ ಮುಂದಿನ ಅಂದಾಜು",
      demonstrationOutlookNotice: "ಕೃತಕ ಮಾದರಿಯ ಆಧಾರದ ಮೇಲೆ • ಕೇವಲ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ"
    }
  }
};

// Deep merge helper
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Apply additions
for (const secKey of Object.keys(additions)) {
  if (!en[secKey]) en[secKey] = {};
  if (!hi[secKey]) hi[secKey] = {};
  if (!kn[secKey]) kn[secKey] = {};

  for (const itemKey of Object.keys(additions[secKey])) {
    const val = additions[secKey][itemKey];
    if (val.en !== undefined) {
      en[secKey][itemKey] = val.en;
      hi[secKey][itemKey] = val.hi;
      kn[secKey][itemKey] = val.kn;
    } else {
      // nested object (e.g. weatherConditions)
      if (!en[secKey][itemKey]) en[secKey][itemKey] = {};
      if (!hi[secKey][itemKey]) hi[secKey][itemKey] = {};
      if (!kn[secKey][itemKey]) kn[secKey][itemKey] = {};
      for (const subKey of Object.keys(val)) {
        en[secKey][itemKey][subKey] = val[subKey].en;
        hi[secKey][itemKey][subKey] = val[subKey].hi;
        kn[secKey][itemKey][subKey] = val[subKey].kn;
      }
    }
  }
}

// Apply refinements
deepMerge(hi, refinements.hi);
deepMerge(kn, refinements.kn);

// Write back
fs.writeFileSync(enPath, 'export default ' + JSON.stringify(en, null, 2) + ';\n', 'utf8');
fs.writeFileSync(hiPath, 'export default ' + JSON.stringify(hi, null, 2) + ';\n', 'utf8');
fs.writeFileSync(knPath, 'export default ' + JSON.stringify(kn, null, 2) + ';\n', 'utf8');

console.log('✅ Updated en.js, hi.js, kn.js successfully with all new keys and natural refinements.');
