"""
Multi-City Historical Flood Event Catalog for DrainSense India.
Integrates documented flood disaster records for:
1. Vijayawada / Amaravati (2024 Budameru, 2020 Cyclone Nivar, 2019 Krishna Basin)
2. Chennai (2023 Cyclone Michaung, 2015 Historic Deluge)
3. Mumbai (2005 Cloudburst, 2023 Monsoon Surge)
4. Bengaluru (2022 EcoSpace/Bellandur Inundation, 2024 Storm)
"""

import json
import pandas as pd

MULTI_CITY_FLOOD_EVENTS = [
    # Vijayawada Events
    {
        "city_id": "VJA",
        "city_name": "Vijayawada / Amaravati",
        "event_id": "FL_VJA_2024_09",
        "title": "Budameru Flash Inundation & Krishna Surplus (September 2024)",
        "start_date": "2024-08-31",
        "end_date": "2024-09-08",
        "peak_24h_rainfall_mm": 290.0,
        "severity": "CRITICAL",
        "water_level_m": 3.2,
        "affected_population_est": 275000,
        "key_zones": ["Ajit Singh Nagar", "Payakapuram", "Nunna", "Kundavari Kandrika", "Ibrahimpatnam"],
        "description": "Unprecedented 290mm rainfall in Krishna/Budameru catchment caused Budameru breaches inundating over 30 municipal wards in northern Vijayawada. Prakasam barrage discharged 11.43 lakh cusecs.",
        "response_summary": "45 SDRF/NDRF teams deployed with 180 motorized rescue boats; drone food dropping deployed in Singh Nagar."
    },
    {
        "city_id": "VJA",
        "city_name": "Vijayawada / Amaravati",
        "event_id": "FL_VJA_2020_10",
        "title": "Krishna River Depression & Urban Waterlogging (October 2020)",
        "start_date": "2020-10-12",
        "end_date": "2020-10-16",
        "peak_24h_rainfall_mm": 175.0,
        "severity": "HIGH",
        "water_level_m": 1.8,
        "affected_population_est": 90000,
        "key_zones": ["One Town", "Gunadala", "Patamata", "Governorpet"],
        "description": "Deep depression over West-Central Bay of Bengal caused sustained heavy precipitation overwhelming urban stormwater canals (Eluru and Ryves canals).",
        "response_summary": "Municipal pumps drained low-lying subways; power supply temporarily disconnected in waterlogged wards."
    },
    {
        "city_id": "VJA",
        "city_name": "Vijayawada / Amaravati",
        "event_id": "FL_VJA_2019_08",
        "title": "Krishna River Basin Flood (August 2019)",
        "start_date": "2019-08-10",
        "end_date": "2019-08-18",
        "peak_24h_rainfall_mm": 210.0,
        "severity": "HIGH",
        "water_level_m": 2.4,
        "affected_population_est": 120000,
        "key_zones": ["Krishnalanka", "Bhavanipuram", "Undavalli", "Tadepalle"],
        "description": "Huge inflows into Prakasam Barrage (8.2 lakh cusecs) inundated riverbank settlements along Krishnalanka and low-lying agricultural plains in Undavalli.",
        "response_summary": "Evacuation of 15,000 residents from Krishna riverbed into 28 municipal relief centers."
    },
    # Chennai Events
    {
        "city_id": "CHE",
        "city_name": "Chennai",
        "event_id": "FL_CHE_2023_12",
        "title": "Cyclone Michaung Catastrophic Inundation (December 2023)",
        "start_date": "2023-12-03",
        "end_date": "2023-12-07",
        "peak_24h_rainfall_mm": 450.0,
        "severity": "CRITICAL",
        "water_level_m": 3.5,
        "affected_population_est": 450000,
        "key_zones": ["Velachery", "Mudichur", "Pallikaranai", "Perumbakkam", "Kolathur"],
        "description": "Severe Cyclonic Storm Michaung stalled off Chennai coast dumping over 450mm in 24 hours. Adyar and Cooum rivers breached banks while Buckingham Canal backed up from coastal storm surges.",
        "response_summary": "Indian Army and NDRF deployed hovercrafts and amphibious tracked vehicles; 350+ heavy submersible pumps deployed in Velachery."
    },
    {
        "city_id": "CHE",
        "city_name": "Chennai",
        "event_id": "FL_CHE_2015_12",
        "title": "Historic Chennai Deluge (December 2015)",
        "start_date": "2015-11-30",
        "end_date": "2015-12-05",
        "peak_24h_rainfall_mm": 494.0,
        "severity": "CRITICAL",
        "water_level_m": 4.0,
        "affected_population_est": 800000,
        "key_zones": ["Saidapet", "Kotturpuram", "T. Nagar", "Tambaram", "Velachery"],
        "description": "Highest single-day precipitation in a century (494mm) combined with 29,000 cusecs release from Chembarambakkam reservoir inundated 100+ wards under 2 to 4 meters of water.",
        "response_summary": "Tri-service rescue operation; Chennai airport runway submerged for 5 days; INS Airavat deployed with humanitarian relief."
    },
    # Mumbai Events
    {
        "city_id": "BOM",
        "city_name": "Mumbai",
        "event_id": "FL_BOM_2005_07",
        "title": "Historic July 26 Mumbai Cloudburst (July 2005)",
        "start_date": "2005-07-26",
        "end_date": "2005-07-28",
        "peak_24h_rainfall_mm": 944.0,
        "severity": "CRITICAL",
        "water_level_m": 3.8,
        "affected_population_est": 1200000,
        "key_zones": ["Kurla", "Sion", "Hindmata", "Bandra-Kurla Complex", "Milan Subway"],
        "description": "Unprecedented 944mm rainfall within 24 hours synchronized with high tide in the Arabian Sea choked Mithi River discharge, paralyzing suburban rail and drowning subways.",
        "response_summary": "Armed forces airlifted marooned passengers; formation of Chitale Committee and launch of BRIMSTOWAD stormwater drainage revamp."
    },
    {
        "city_id": "BOM",
        "city_name": "Mumbai",
        "event_id": "FL_BOM_2023_07",
        "title": "Monsoon Surge & Mithi River High Alert (July 2023)",
        "start_date": "2023-07-20",
        "end_date": "2023-07-25",
        "peak_24h_rainfall_mm": 280.0,
        "severity": "HIGH",
        "water_level_m": 1.9,
        "affected_population_est": 180000,
        "key_zones": ["Hindmata", "King's Circle", "Kurla West", "Andheri Subway"],
        "description": "Intense active monsoon surge coinciding with 4.5m spring tides caused severe waterlogging in central Mumbai low-lying chronic spots.",
        "response_summary": "BMC activated 450 dewatering dewatering pumps and underground stormwater holding tanks at Pramod Mahajan Park & Milan Subway."
    },
    # Bengaluru Events
    {
        "city_id": "BLR",
        "city_name": "Bengaluru",
        "event_id": "FL_BLR_2022_09",
        "title": "Bellandur & EcoSpace Tech Corridor Inundation (September 2022)",
        "start_date": "2022-09-04",
        "end_date": "2022-09-07",
        "peak_24h_rainfall_mm": 131.0,
        "severity": "CRITICAL",
        "water_level_m": 2.2,
        "affected_population_est": 150000,
        "key_zones": ["Bellandur", "Outer Ring Road (EcoSpace)", "Rainbow Drive", "Mahadevapura", "Manyata"],
        "description": "Severe convective storms choked stormwater drains (Rajakaluves) encroached by rapid IT corridor development. Bellandur and Varthur lakes overflowed, submerging tech parks and luxury villas.",
        "response_summary": "SDRF deployed tractors and inflatable boats to evacuate IT professionals; BBMP initiated emergency demolition of rajakaluve encroachments."
    },
    # Delhi NCR Event
    {
        "city_id": "DEL",
        "city_name": "Delhi NCR",
        "event_id": "FL_DEL_2023_07",
        "title": "Historic Yamuna 208.66m Breach & Ring Road Deluge (July 2023)",
        "start_date": "2023-07-09",
        "end_date": "2023-07-16",
        "peak_24h_rainfall_mm": 153.0,
        "severity": "CRITICAL",
        "water_level_m": 208.66,
        "affected_population_est": 350000,
        "key_zones": ["Yamuna Bazar", "Kashmere Gate ISBT", "ITO Barrage", "Monastery Market", "Civil Lines", "Mayur Vihar"],
        "description": "Unprecedented discharge from Hathnikund Barrage combined with heavy local rain pushed Yamuna to an all-time record 208.66m, submerging ITO Ring Road, Kashmere Gate ISBT, and Supreme Court gate.",
        "response_summary": "Indian Army deployed engineering regiments to repair breached regulator 12 at WHO building; 25,000 people evacuated to relief camps."
    },
    # Hyderabad Event
    {
        "city_id": "HYD",
        "city_name": "Hyderabad",
        "event_id": "FL_HYD_2020_10",
        "title": "Historic Hyderabad Cloudburst & Musi River Deluge (October 2020)",
        "start_date": "2020-10-13",
        "end_date": "2020-10-19",
        "peak_24h_rainfall_mm": 324.0,
        "severity": "CRITICAL",
        "water_level_m": 2.8,
        "affected_population_est": 250000,
        "key_zones": ["Nadeem Colony", "Begumpet", "Moosarambagh", "Al Jubail Colony", "Tolichowki", "Hafiz Baba Nagar"],
        "description": "Deep depression produced historic 324mm rainfall in 24 hours (highest since 1908). Musi River and Hussain Sagar surplus weirs overflowed, submerging residential colonies under 10 feet of water.",
        "response_summary": "NDRF & Indian Army columns mobilized with motorized Gemini boats; GHMC distributed financial relief to 6.5 lakh flood-hit families."
    },
    # Kolkata Event
    {
        "city_id": "CCU",
        "city_name": "Kolkata",
        "event_id": "FL_CCU_2020_05",
        "title": "Super Cyclone Amphan Storm Surge & Urban Inundation (May 2020)",
        "start_date": "2020-05-20",
        "end_date": "2020-05-24",
        "peak_24h_rainfall_mm": 236.0,
        "severity": "CRITICAL",
        "water_level_m": 2.5,
        "affected_population_est": 400000,
        "key_zones": ["Behala", "Thanthania", "EM Bypass", "Park Circus", "Taratala", "College Street"],
        "description": "Category 5 Super Cyclone Amphan landfall triggered 130 km/h gusts and 236mm rainfall. Storm surge backed up Hooghly drainage sluices, leaving Central and South Kolkata underwater for 5 days.",
        "response_summary": "KMC activated 76 drainage pumping stations; Indian Army cleared 1,000+ uprooted banyan trees blocking drainage arteries."
    },
    # Ahmedabad Event
    {
        "city_id": "AMD",
        "city_name": "Ahmedabad",
        "event_id": "FL_AMD_2022_07",
        "title": "Ahmedabad Flash Cloudburst & Underpass Inundation (July 2022)",
        "start_date": "2022-07-10",
        "end_date": "2022-07-14",
        "peak_24h_rainfall_mm": 220.0,
        "severity": "HIGH",
        "water_level_m": 2.0,
        "affected_population_est": 120000,
        "key_zones": ["Akhbarnagar Underpass", "Vatva", "Isanpur", "Paldi", "Maninagar", "Vasna"],
        "description": "Sudden cloudburst dumped 115mm in 3 hours, completely drowning 8 vehicular underpasses. Kharicut canal overflowed into eastern industrial and residential clusters.",
        "response_summary": "AMC sealed all railway underpasses to prevent vehicular drownings; 28 gates of Vasna barrage opened to drain Sabarmati."
    },
    # Pune Event
    {
        "city_id": "PNQ",
        "city_name": "Pune",
        "event_id": "FL_PNQ_2019_09",
        "title": "Ambil Odha Stream Flash Deluge & Wall Collapse (September 2019)",
        "start_date": "2019-09-25",
        "end_date": "2019-09-29",
        "peak_24h_rainfall_mm": 212.0,
        "severity": "CRITICAL",
        "water_level_m": 2.6,
        "affected_population_est": 85000,
        "key_zones": ["Ambil Odha", "Sinhagad Road", "Aranyeshwar", "Sahakar Nagar", "Pulachi Wadi", "Khadki"],
        "description": "Intense convective cloudburst (110mm in 2 hours) caused the Ambil Odha stream to swell catastrophically. Compound walls breached, washing away hundreds of parked vehicles along Sinhagad Road.",
        "response_summary": "PMC and NDRF mounted midnight rescue operations; compensation distributed for damaged housing societies and vehicles."
    },
    # Kochi Event
    {
        "city_id": "COK",
        "city_name": "Kochi",
        "event_id": "FL_COK_2018_08",
        "title": "Great Kerala Deluge & Periyar River Inundation (August 2018)",
        "start_date": "2018-08-15",
        "end_date": "2018-08-22",
        "peak_24h_rainfall_mm": 310.0,
        "severity": "CRITICAL",
        "water_level_m": 3.4,
        "affected_population_est": 320000,
        "key_zones": ["Aluva", "Edappally", "Kaloor", "Companypady", "Panampilly Nagar", "Thevara"],
        "description": "Opening of 35 dams across Kerala caused Periyar River to discharge peak surges. Kochi International Airport (CIAL) runway was submerged under 4 feet of water for two weeks.",
        "response_summary": "Indian Navy executed 'Operation Madad'; 800+ indigenous fisherman boats rescued over 65,000 citizens from rooftop sumps."
    },
    # Guwahati Event
    {
        "city_id": "GAU",
        "city_name": "Guwahati",
        "event_id": "FL_GAU_2022_06",
        "title": "Bharalu River Urban Flash Flood & Hill Slump (June 2022)",
        "start_date": "2022-06-15",
        "end_date": "2022-06-22",
        "peak_24h_rainfall_mm": 185.0,
        "severity": "HIGH",
        "water_level_m": 2.1,
        "affected_population_est": 110000,
        "key_zones": ["Anil Nagar", "Nabin Nagar", "Rukminigaon", "Zoo Road", "Rajgarh", "Chandmari"],
        "description": "Heavy monsoon downpours combined with Brahmaputra high water levels prevented Bharalu river sluice gates from discharging, turning low-lying municipal wards into standing lakes.",
        "response_summary": "SDRF rubber boats operated inside Anil Nagar lanes for 6 consecutive days; super-sucker dewatering pumps deployed at Bharalumukh."
    },
    # Patna Event
    {
        "city_id": "PAT",
        "city_name": "Patna",
        "event_id": "FL_PAT_2019_09",
        "title": "Historic Patna Urban Sump Deluge (September-October 2019)",
        "start_date": "2019-09-27",
        "end_date": "2019-10-05",
        "peak_24h_rainfall_mm": 245.0,
        "severity": "CRITICAL",
        "water_level_m": 3.0,
        "affected_population_est": 380000,
        "key_zones": ["Rajendra Nagar", "Kankarbagh", "Patliputra Colony", "Bazar Samiti", "Lohanipur"],
        "description": "Ganga and Punpun rivers flowed above danger marks while 245mm torrential rain fell in 48 hours. Drainage sump houses failed due to siltation, marooning Rajendra Nagar under 8 feet of water for 9 days.",
        "response_summary": "NDRF & Coal India high-capacity 1000 GPM dewatering pumps deployed; IAF helicopters air-dropped 100,000 food packets."
    }
]

def save_multi_city_flood_events(output_path: str = "data/processed/historical_flood_events.json"):
    with open(output_path, "w") as f:
        json.dump(MULTI_CITY_FLOOD_EVENTS, f, indent=2)
    pd.DataFrame(MULTI_CITY_FLOOD_EVENTS).to_csv("data/processed/historical_flood_events.csv", index=False)
    print(f"Saved {len(MULTI_CITY_FLOOD_EVENTS)} historical flood disaster events across 4 Indian cities.")
    return MULTI_CITY_FLOOD_EVENTS

if __name__ == "__main__":
    save_multi_city_flood_events()
