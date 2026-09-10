"""
Multi-City Geospatial Grid Loader and Feature Generator for DrainSense India.
Generates deterministic 500m x 500m grid cells for:
1. Vijayawada / Amaravati (VJA)
2. Chennai (CHE)
3. Mumbai (BOM)
4. Bengaluru (BLR)
with realistic topography, river/canal proximity, and urban density features.
"""

import math
import json
import os
from typing import Dict, List, Any
import numpy as np
import pandas as pd

SPATIAL_SEED = 42

CITY_SPECS = {
    "VJA": {
        "name": "Vijayawada / Amaravati",
        "bbox": {"min_lat": 16.450, "max_lat": 16.570, "min_lon": 80.560, "max_lon": 80.700},
        "lat_step": 0.0045,
        "lon_step": 0.0047,
        "center": (16.512, 80.628),
        "waterways": [
            # Krishna River
            [(16.495, 80.560), (16.507, 80.605), (16.505, 80.620), (16.485, 80.685), (16.475, 80.700)],
            # Budameru Rivulet
            [(16.568, 80.560), (16.560, 80.600), (16.552, 80.630), (16.545, 80.660), (16.530, 80.700)],
            # Canals
            [(16.507, 80.615), (16.520, 80.640), (16.545, 80.700)]
        ],
        "named_zones": [
            {"name": "Ajit Singh Nagar (Budameru Basin)", "lat": 16.542, "lon": 80.635, "elev_range": (14.5, 18.0), "flood_prone": True},
            {"name": "Payakapuram / Nunna", "lat": 16.555, "lon": 80.645, "elev_range": (15.0, 19.0), "flood_prone": True},
            {"name": "Krishnalanka (Riverfront)", "lat": 16.500, "lon": 80.630, "elev_range": (14.0, 18.5), "flood_prone": True},
            {"name": "One Town / Indrakeeladri Hills", "lat": 16.515, "lon": 80.610, "elev_range": (55.0, 105.0), "flood_prone": False},
            {"name": "Governorpet / Gandhinagar", "lat": 16.512, "lon": 80.628, "elev_range": (19.0, 24.0), "flood_prone": True},
            {"name": "Patamata / Benz Circle", "lat": 16.498, "lon": 80.655, "elev_range": (20.0, 26.0), "flood_prone": False},
            {"name": "Gunadala", "lat": 16.525, "lon": 80.660, "elev_range": (18.0, 23.0), "flood_prone": True},
            {"name": "Bhavanipuram", "lat": 16.515, "lon": 80.590, "elev_range": (19.0, 25.0), "flood_prone": False},
            {"name": "Tadepalle (Amaravati)", "lat": 16.480, "lon": 80.605, "elev_range": (16.0, 21.0), "flood_prone": True},
            {"name": "Undavalli (Floodplain)", "lat": 16.492, "lon": 80.585, "elev_range": (15.0, 19.5), "flood_prone": True},
            {"name": "Mangalagiri Foothills", "lat": 16.455, "lon": 80.575, "elev_range": (40.0, 85.0), "flood_prone": False}
        ]
    },
    "CHE": {
        "name": "Chennai",
        "bbox": {"min_lat": 12.920, "max_lat": 13.120, "min_lon": 80.140, "max_lon": 80.290},
        "lat_step": 0.0045,
        "lon_step": 0.0046,
        "center": (13.040, 80.220),
        "waterways": [
            # Adyar River
            [(12.980, 80.140), (13.000, 80.180), (13.010, 80.230), (13.008, 80.275)],
            # Cooum River
            [(13.070, 80.140), (13.075, 80.190), (13.070, 80.240), (13.065, 80.285)],
            # Buckingham Canal
            [(12.920, 80.245), (13.000, 80.255), (13.070, 80.280), (13.120, 80.290)],
            # Pallikaranai Marsh
            [(12.930, 80.200), (12.950, 80.220), (12.970, 80.210)]
        ],
        "named_zones": [
            {"name": "Velachery (Lake Basin)", "lat": 12.980, "lon": 80.220, "elev_range": (4.5, 8.0), "flood_prone": True},
            {"name": "Mudichur / Tambaram West", "lat": 12.925, "lon": 80.150, "elev_range": (11.0, 16.0), "flood_prone": True},
            {"name": "Pallikaranai Marshland Buffer", "lat": 12.940, "lon": 80.210, "elev_range": (2.5, 6.0), "flood_prone": True},
            {"name": "T. Nagar / Usman Road Subway", "lat": 13.040, "lon": 80.230, "elev_range": (8.0, 13.0), "flood_prone": True},
            {"name": "Saidapet (Adyar Riverfront)", "lat": 13.020, "lon": 80.220, "elev_range": (5.0, 9.5), "flood_prone": True},
            {"name": "Kotturpuram (Adyar Basin)", "lat": 13.015, "lon": 80.240, "elev_range": (4.0, 8.5), "flood_prone": True},
            {"name": "Guindy / Kathipara", "lat": 13.005, "lon": 80.200, "elev_range": (12.0, 18.0), "flood_prone": False},
            {"name": "Anna Nagar", "lat": 13.085, "lon": 80.210, "elev_range": (14.0, 20.0), "flood_prone": False},
            {"name": "Marina Coastline / Mylapore", "lat": 13.035, "lon": 80.270, "elev_range": (6.0, 11.0), "flood_prone": False},
            {"name": "Perumbakkam Tech Corridor", "lat": 12.920, "lon": 80.190, "elev_range": (5.0, 9.0), "flood_prone": True},
            {"name": "Kolathur / Otteri Nullah", "lat": 13.110, "lon": 80.210, "elev_range": (7.0, 12.0), "flood_prone": True}
        ]
    },
    "BOM": {
        "name": "Mumbai",
        "bbox": {"min_lat": 18.960, "max_lat": 19.220, "min_lon": 72.800, "max_lon": 72.960},
        "lat_step": 0.0050,
        "lon_step": 0.0048,
        "center": (19.076, 72.877),
        "waterways": [
            # Mithi River
            [(19.140, 72.890), (19.100, 72.870), (19.070, 72.860), (19.050, 72.840)],
            # Oshiwara River
            [(19.180, 72.860), (19.150, 72.835), (19.140, 72.820)],
            # Dahisar River
            [(19.250, 72.870), (19.240, 72.850)]
        ],
        "named_zones": [
            {"name": "Kurla West (Mithi River Basin)", "lat": 19.070, "lon": 72.875, "elev_range": (3.5, 7.5), "flood_prone": True},
            {"name": "Hindmata / Dadar TT", "lat": 19.015, "lon": 72.845, "elev_range": (2.8, 6.0), "flood_prone": True},
            {"name": "Sion / Gandhi Market", "lat": 19.040, "lon": 72.860, "elev_range": (3.0, 6.5), "flood_prone": True},
            {"name": "Milan Subway / Santacruz", "lat": 19.080, "lon": 72.840, "elev_range": (4.0, 7.5), "flood_prone": True},
            {"name": "Bandra-Kurla Complex (BKC)", "lat": 19.060, "lon": 72.865, "elev_range": (4.5, 9.0), "flood_prone": True},
            {"name": "Andheri Subway / S.V. Road", "lat": 19.120, "lon": 72.845, "elev_range": (6.0, 11.0), "flood_prone": True},
            {"name": "Malabar Hill (South Mumbai)", "lat": 18.960, "lon": 72.805, "elev_range": (35.0, 55.0), "flood_prone": False},
            {"name": "Powai Foothills", "lat": 19.120, "lon": 72.905, "elev_range": (25.0, 50.0), "flood_prone": False},
            {"name": "Chembur / Eastern Suburbs", "lat": 19.060, "lon": 72.900, "elev_range": (7.0, 14.0), "flood_prone": False},
            {"name": "Borivali National Park Slope", "lat": 19.220, "lon": 72.900, "elev_range": (30.0, 75.0), "flood_prone": False}
        ]
    },
    "BLR": {
        "name": "Bengaluru",
        "bbox": {"min_lat": 12.870, "max_lat": 13.070, "min_lon": 77.520, "max_lon": 77.720},
        "lat_step": 0.0048,
        "lon_step": 0.0048,
        "center": (12.9716, 77.6200),
        "waterways": [
            # Bellandur - Varthur Lake system
            [(12.935, 77.670), (12.945, 77.695), (12.940, 77.730)],
            # Vrishabhavathi Valley
            [(12.980, 77.530), (12.930, 77.510), (12.870, 77.490)],
            # Hebbal Valley
            [(13.045, 77.590), (13.030, 77.630)]
        ],
        "named_zones": [
            {"name": "Bellandur (Lake Inundation Zone)", "lat": 12.930, "lon": 77.675, "elev_range": (870.0, 882.0), "flood_prone": True},
            {"name": "Outer Ring Road (EcoSpace Tech Park)", "lat": 12.925, "lon": 77.685, "elev_range": (872.0, 884.0), "flood_prone": True},
            {"name": "Rainbow Drive / Sarjapur Road", "lat": 12.905, "lon": 77.690, "elev_range": (868.0, 880.0), "flood_prone": True},
            {"name": "Mahadevapura Tech Corridor", "lat": 12.985, "lon": 77.695, "elev_range": (875.0, 890.0), "flood_prone": True},
            {"name": "Manyata Tech Park / Nagawara", "lat": 13.045, "lon": 77.620, "elev_range": (880.0, 895.0), "flood_prone": True},
            {"name": "Koramangala 4th Block", "lat": 12.935, "lon": 77.625, "elev_range": (885.0, 898.0), "flood_prone": True},
            {"name": "Indiranagar (Ridge)", "lat": 12.975, "lon": 77.640, "elev_range": (905.0, 925.0), "flood_prone": False},
            {"name": "MG Road / Central CBD", "lat": 12.975, "lon": 77.605, "elev_range": (910.0, 930.0), "flood_prone": False},
            {"name": "Jayanagar / South Plateau", "lat": 12.925, "lon": 77.585, "elev_range": (915.0, 935.0), "flood_prone": False},
            {"name": "Whitefield (East Plateau)", "lat": 12.970, "lon": 77.750, "elev_range": (885.0, 905.0), "flood_prone": False}
        ]
    },
    "DEL": {
        "name": "Delhi NCR",
        "bbox": {"min_lat": 28.500, "max_lat": 28.750, "min_lon": 77.050, "max_lon": 77.350},
        "lat_step": 0.0060,
        "lon_step": 0.0060,
        "center": (28.6139, 77.2090),
        "waterways": [
            [(28.750, 77.220), (28.680, 77.230), (28.630, 77.250), (28.550, 77.300)], # Yamuna River
            [(28.620, 77.050), (28.650, 77.120), (28.700, 77.210)], # Najafgarh Drain
            [(28.580, 77.220), (28.590, 77.260)] # Barapullah Nullah
        ],
        "named_zones": [
            {"name": "Yamuna Bazar / Kashmere Gate (Riverbed)", "lat": 28.665, "lon": 77.235, "elev_range": (204.0, 208.0), "flood_prone": True},
            {"name": "Monastery Market / Civil Lines", "lat": 28.680, "lon": 77.228, "elev_range": (205.0, 210.0), "flood_prone": True},
            {"name": "ITO Ring Road / Pragati Maidan", "lat": 28.625, "lon": 77.245, "elev_range": (207.0, 212.0), "flood_prone": True},
            {"name": "Minto Bridge Underpass", "lat": 28.635, "lon": 77.225, "elev_range": (209.0, 213.0), "flood_prone": True},
            {"name": "Sarita Vihar / Badarpur Lowland", "lat": 28.530, "lon": 77.290, "elev_range": (205.0, 212.0), "flood_prone": True},
            {"name": "Najafgarh Low-Lying Basin", "lat": 28.610, "lon": 77.080, "elev_range": (208.0, 214.0), "flood_prone": True},
            {"name": "Delhi Ridge / Dhaula Kuan (Highland)", "lat": 28.590, "lon": 77.160, "elev_range": (245.0, 275.0), "flood_prone": False},
            {"name": "Connaught Place / Central Vista", "lat": 28.620, "lon": 77.215, "elev_range": (216.0, 225.0), "flood_prone": False},
            {"name": "Chanakyapuri Diplomatic Enclave", "lat": 28.595, "lon": 77.185, "elev_range": (228.0, 245.0), "flood_prone": False}
        ]
    },
    "HYD": {
        "name": "Hyderabad",
        "bbox": {"min_lat": 17.300, "max_lat": 17.500, "min_lon": 78.350, "max_lon": 78.600},
        "lat_step": 0.0055,
        "lon_step": 0.0055,
        "center": (17.3850, 78.4867),
        "waterways": [
            [(17.370, 78.350), (17.375, 78.450), (17.365, 78.550)], # Musi River
            [(17.420, 78.470), (17.435, 78.480)], # Hussain Sagar Lake
            [(17.480, 78.410), (17.450, 78.440)] # Kukatpally Nala
        ],
        "named_zones": [
            {"name": "Moosarambagh / Chaderghat (Musi Basin)", "lat": 17.370, "lon": 78.500, "elev_range": (490.0, 502.0), "flood_prone": True},
            {"name": "Begumpet / Brahmanwadi (Nala Overflow)", "lat": 17.445, "lon": 78.470, "elev_range": (510.0, 520.0), "flood_prone": True},
            {"name": "Nadeem Colony / Tolichowki Sump", "lat": 17.400, "lon": 78.410, "elev_range": (505.0, 515.0), "flood_prone": True},
            {"name": "Kukatpally / Nizampet Lowland", "lat": 17.490, "lon": 78.390, "elev_range": (525.0, 538.0), "flood_prone": True},
            {"name": "Hussain Sagar Surplus Canal (Suraram)", "lat": 17.430, "lon": 78.485, "elev_range": (508.0, 518.0), "flood_prone": True},
            {"name": "Banjara Hills / Jubilee Hills (Ridge)", "lat": 17.430, "lon": 78.410, "elev_range": (570.0, 615.0), "flood_prone": False},
            {"name": "HITEC City / Madhapur Plateau", "lat": 17.450, "lon": 78.375, "elev_range": (560.0, 595.0), "flood_prone": False},
            {"name": "Gachibowli Financial District", "lat": 17.440, "lon": 78.350, "elev_range": (550.0, 580.0), "flood_prone": False}
        ]
    },
    "CCU": {
        "name": "Kolkata",
        "bbox": {"min_lat": 22.450, "max_lat": 22.650, "min_lon": 88.250, "max_lon": 88.450},
        "lat_step": 0.0050,
        "lon_step": 0.0050,
        "center": (22.5726, 88.3639),
        "waterways": [
            [(22.650, 88.350), (22.580, 88.330), (22.500, 88.310)], # Hooghly River
            [(22.540, 88.420), (22.520, 88.440)], # East Kolkata Wetlands
            [(22.600, 88.370), (22.580, 88.400)] # Circular Canal
        ],
        "named_zones": [
            {"name": "Thanthania / Central Avenue Sump", "lat": 22.580, "lon": 22.580, "elev_range": (4.0, 6.5), "flood_prone": True},
            {"name": "Behala / Taratala Waterlogging Pocket", "lat": 22.500, "lon": 88.310, "elev_range": (3.5, 6.0), "flood_prone": True},
            {"name": "EM Bypass / Patuli Drainage Basin", "lat": 22.480, "lon": 88.390, "elev_range": (3.0, 5.5), "flood_prone": True},
            {"name": "Park Circus / Topsia Canal Zone", "lat": 22.540, "lon": 88.380, "elev_range": (4.0, 6.8), "flood_prone": True},
            {"name": "Ultadanga / Kankurgachi Lowland", "lat": 22.590, "lon": 88.390, "elev_range": (4.5, 7.0), "flood_prone": True},
            {"name": "Salt Lake Sector V / New Town", "lat": 22.570, "lon": 88.430, "elev_range": (6.5, 10.0), "flood_prone": False},
            {"name": "Alipore / New Alipore (High Ground)", "lat": 22.525, "lon": 88.335, "elev_range": (8.0, 12.0), "flood_prone": False},
            {"name": "BBD Bagh / High Court Levee", "lat": 22.570, "lon": 88.345, "elev_range": (8.5, 13.0), "flood_prone": False}
        ]
    },
    "AMD": {
        "name": "Ahmedabad",
        "bbox": {"min_lat": 22.950, "max_lat": 23.120, "min_lon": 72.480, "max_lon": 72.680},
        "lat_step": 0.0050,
        "lon_step": 0.0050,
        "center": (23.0225, 72.5714),
        "waterways": [
            [(23.120, 72.590), (23.040, 72.570), (22.950, 72.580)], # Sabarmati River
            [(23.080, 72.640), (22.990, 72.620)] # Kharicut Canal
        ],
        "named_zones": [
            {"name": "Vatva / Isanpur Canal Lowland", "lat": 22.970, "lon": 72.610, "elev_range": (44.0, 48.0), "flood_prone": True},
            {"name": "Paldi / Vasna Barrage Tailback", "lat": 23.010, "lon": 72.550, "elev_range": (46.0, 50.0), "flood_prone": True},
            {"name": "Maninagar / Chandola Lake Overflow", "lat": 22.995, "lon": 72.590, "elev_range": (45.0, 49.5), "flood_prone": True},
            {"name": "Akhbarnagar Underpass Basin", "lat": 23.060, "lon": 72.560, "elev_range": (47.0, 52.0), "flood_prone": True},
            {"name": "Bodakdev / SG Highway Ridge", "lat": 23.040, "lon": 72.510, "elev_range": (58.0, 68.0), "flood_prone": False},
            {"name": "Satellite / Prahlad Nagar", "lat": 23.015, "lon": 72.515, "elev_range": (55.0, 65.0), "flood_prone": False}
        ]
    },
    "PNQ": {
        "name": "Pune",
        "bbox": {"min_lat": 18.420, "max_lat": 18.620, "min_lon": 73.750, "max_lon": 73.950},
        "lat_step": 0.0050,
        "lon_step": 0.0050,
        "center": (18.5204, 73.8567),
        "waterways": [
            [(18.500, 73.780), (18.530, 73.850), (18.540, 73.930)], # Mula-Mutha River
            [(18.470, 73.840), (18.500, 73.850)] # Ambil Odha Stream
        ],
        "named_zones": [
            {"name": "Sinhagad Road / Ambil Odha Breach", "lat": 18.480, "lon": 73.835, "elev_range": (545.0, 555.0), "flood_prone": True},
            {"name": "Pulachi Wadi / Deccan Gymkhana Riverfront", "lat": 18.515, "lon": 73.845, "elev_range": (548.0, 556.0), "flood_prone": True},
            {"name": "Sangamwadi / Yerwada Confluence", "lat": 18.540, "lon": 73.875, "elev_range": (544.0, 552.0), "flood_prone": True},
            {"name": "Khadki / Bopodi Lowland Sump", "lat": 18.565, "lon": 73.840, "elev_range": (547.0, 556.0), "flood_prone": True},
            {"name": "Kothrud / Paud Road Slopes", "lat": 18.505, "lon": 73.805, "elev_range": (575.0, 610.0), "flood_prone": False},
            {"name": "Viman Nagar / Kalyani Nagar Plateau", "lat": 18.560, "lon": 73.910, "elev_range": (570.0, 600.0), "flood_prone": False}
        ]
    },
    "COK": {
        "name": "Kochi",
        "bbox": {"min_lat": 9.900, "max_lat": 10.080, "min_lon": 76.220, "max_lon": 76.380},
        "lat_step": 0.0045,
        "lon_step": 0.0045,
        "center": (9.9312, 76.2673),
        "waterways": [
            [(10.080, 76.320), (10.010, 76.280), (9.920, 76.260)], # Vembanad / Periyar River
            [(10.030, 76.300), (9.990, 76.310)] # Edappally Canal
        ],
        "named_zones": [
            {"name": "Kaloor / Stadium Link Canal Sump", "lat": 9.990, "lon": 76.290, "elev_range": (1.8, 3.5), "flood_prone": True},
            {"name": "Edappally Toll / Toll Junction Basin", "lat": 10.025, "lon": 76.310, "elev_range": (2.0, 4.0), "flood_prone": True},
            {"name": "Aluva (Periyar Overflow Floodplain)", "lat": 10.070, "lon": 76.350, "elev_range": (3.5, 7.0), "flood_prone": True},
            {"name": "Thevara / Panampilly Nagar Waterfront", "lat": 9.950, "lon": 76.295, "elev_range": (1.5, 3.2), "flood_prone": True},
            {"name": "Kakkanad InfoPark (Midland Hillock)", "lat": 10.010, "lon": 76.360, "elev_range": (22.0, 48.0), "flood_prone": False},
            {"name": "Fort Kochi Coastal Ridge", "lat": 9.965, "lon": 76.240, "elev_range": (3.5, 7.5), "flood_prone": False}
        ]
    },
    "GAU": {
        "name": "Guwahati",
        "bbox": {"min_lat": 26.100, "max_lat": 26.220, "min_lon": 91.650, "max_lon": 91.850},
        "lat_step": 0.0045,
        "lon_step": 0.0045,
        "center": (26.1445, 91.7362),
        "waterways": [
            [(26.210, 91.650), (26.190, 91.750), (26.180, 91.850)], # Brahmaputra River
            [(26.170, 91.760), (26.150, 91.740)], # Bharalu River
            [(26.120, 91.660), (26.110, 91.680)] # Deepor Beel
        ],
        "named_zones": [
            {"name": "Anil Nagar / Nabin Nagar (Bharalu Basin)", "lat": 26.160, "lon": 91.770, "elev_range": (48.0, 52.5), "flood_prone": True},
            {"name": "Rukminigaon / Down Town Lowland", "lat": 26.135, "lon": 76.795, "elev_range": (49.0, 53.5), "flood_prone": True},
            {"name": "Zoo Road / RG Baruah Waterlogging Sump", "lat": 26.165, "lon": 91.780, "elev_range": (50.0, 54.0), "flood_prone": True},
            {"name": "Deepor Beel Catchment Lowlands", "lat": 26.115, "lon": 91.665, "elev_range": (47.0, 51.5), "flood_prone": True},
            {"name": "Kamakhya Foothills / Nilachal Hill", "lat": 26.165, "lon": 91.705, "elev_range": (110.0, 260.0), "flood_prone": False},
            {"name": "Dispur Capital Complex Ridge", "lat": 26.140, "lon": 91.790, "elev_range": (65.0, 95.0), "flood_prone": False}
        ]
    },
    "PAT": {
        "name": "Patna",
        "bbox": {"min_lat": 25.550, "max_lat": 25.680, "min_lon": 85.050, "max_lon": 85.250},
        "lat_step": 0.0045,
        "lon_step": 0.0045,
        "center": (25.5941, 85.1376),
        "waterways": [
            [(25.660, 85.050), (25.640, 85.150), (25.610, 85.250)], # Ganga River
            [(25.560, 85.100), (25.550, 85.200)] # Punpun River
        ],
        "named_zones": [
            {"name": "Rajendra Nagar Sump (2019 Deluge Core)", "lat": 25.595, "lon": 85.155, "elev_range": (46.0, 50.5), "flood_prone": True},
            {"name": "Kankarbagh Drainage Bowl", "lat": 25.585, "lon": 85.145, "elev_range": (47.0, 51.0), "flood_prone": True},
            {"name": "Patliputra Colony Low-Lying Sector", "lat": 25.625, "lon": 85.105, "elev_range": (48.0, 52.0), "flood_prone": True},
            {"name": "Gandhi Maidan / Ashok Rajpath", "lat": 25.620, "lon": 85.145, "elev_range": (51.0, 55.5), "flood_prone": False},
            {"name": "Bailey Road / Danapur High Terrace", "lat": 25.605, "lon": 85.070, "elev_range": (53.0, 59.0), "flood_prone": False}
        ]
    }
}

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def dist_to_polylines_m(lat: float, lon: float, polylines: List[List[tuple]]) -> float:
    min_d = float('inf')
    for poly in polylines:
        for p_lat, p_lon in poly:
            d = haversine_m(lat, lon, p_lat, p_lon)
            if d < min_d:
                min_d = d
    return min_d

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    return haversine_m(lat1, lon1, lat2, lon2)

def generate_grid_cells(city_id: str = "VJA") -> pd.DataFrame:
    """Backward compatible alias returning the grid for a specified city (default VJA)."""
    return generate_city_grid(city_id)

def generate_city_grid(city_id: str) -> pd.DataFrame:
    spec = CITY_SPECS.get(city_id)
    if not spec:
        raise ValueError(f"Unknown city_id: {city_id}")

    rng = np.random.default_rng(SPATIAL_SEED + hash(city_id) % 1000)
    bbox = spec["bbox"]
    lat_step = spec["lat_step"]
    lon_step = spec["lon_step"]

    lats = np.arange(bbox["min_lat"], bbox["max_lat"], lat_step)
    lons = np.arange(bbox["min_lon"], bbox["max_lon"], lon_step)

    rows = []
    cell_idx = 1

    for lat in lats:
        for lon in lons:
            grid_id = f"{city_id}_{cell_idx:04d}"
            cell_idx += 1

            center_lat = lat + (lat_step / 2.0)
            center_lon = lon + (lon_step / 2.0)

            # Match closest named zone
            closest_zone = min(
                spec["named_zones"],
                key=lambda z: haversine_m(center_lat, center_lon, z["lat"], z["lon"])
            )
            zone_name = closest_zone["name"]
            elev_min, elev_max = closest_zone["elev_range"]

            dist_water = dist_to_polylines_m(center_lat, center_lon, spec["waterways"])

            elevation_m = round(float(rng.uniform(elev_min, elev_max)), 1)
            slope_deg = round(float(rng.uniform(0.3, 3.5) if closest_zone["flood_prone"] else rng.uniform(2.5, 9.0)), 2)

            # Flow accumulation proxy (higher in depressions near water)
            city_base_elev = min(z["elev_range"][0] for z in spec["named_zones"])
            rel_depression = max(0.0, (city_base_elev + 12.0) - elevation_m)
            flow_acc = max(5.0, min(98.0, rel_depression * 4.0 + (1800.0 / (dist_water + 100.0))))
            flow_accumulation = round(float(flow_acc), 1)

            drainage_density = round(float(max(0.3, min(4.5, 3.6 - (dist_water / 1800.0)))), 2)

            # Urban density & built-up
            center_lat_c, center_lon_c = spec["center"]
            dist_center = haversine_m(center_lat, center_lon, center_lat_c, center_lon_c)
            if dist_center < 4000:
                impervious_ratio = round(float(rng.uniform(0.70, 0.94)), 2)
                road_density = round(float(rng.uniform(9.0, 16.5)), 2)
                bldg_density = round(float(rng.uniform(0.60, 0.88)), 2)
                land_cover = "Urban High Density"
            elif dist_center < 9000:
                impervious_ratio = round(float(rng.uniform(0.45, 0.70)), 2)
                road_density = round(float(rng.uniform(5.0, 9.0)), 2)
                bldg_density = round(float(rng.uniform(0.35, 0.60)), 2)
                land_cover = "Urban Medium Density"
            else:
                impervious_ratio = round(float(rng.uniform(0.20, 0.45)), 2)
                road_density = round(float(rng.uniform(2.0, 5.0)), 2)
                bldg_density = round(float(rng.uniform(0.15, 0.35)), 2)
                land_cover = "Peri-Urban / Open Land"

            # Historical flood frequency
            if closest_zone["flood_prone"] and dist_water < 1800:
                hist_count = int(rng.choice([3, 4, 5], p=[0.2, 0.5, 0.3]))
                hist_freq = round(hist_count / 10.0, 2)
                hist_area_pct = round(float(rng.uniform(65.0, 95.0)), 1)
            elif closest_zone["flood_prone"]:
                hist_count = int(rng.choice([1, 2], p=[0.6, 0.4]))
                hist_freq = round(hist_count / 10.0, 2)
                hist_area_pct = round(float(rng.uniform(30.0, 60.0)), 1)
            else:
                hist_count = 0
                hist_freq = 0.0
                hist_area_pct = 0.0

            poly_coords = [
                [lon, lat],
                [lon + lon_step, lat],
                [lon + lon_step, lat + lat_step],
                [lon, lat + lat_step],
                [lon, lat]
            ]

            rows.append({
                "city_id": city_id,
                "grid_id": grid_id,
                "zone_name": zone_name,
                "latitude": round(center_lat, 5),
                "longitude": round(center_lon, 5),
                "elevation_m": elevation_m,
                "slope_deg": slope_deg,
                "flow_accumulation": flow_accumulation,
                "drainage_density": drainage_density,
                "distance_to_water_m": round(dist_water, 1),
                "distance_to_budameru_m": round(dist_water if city_id == "VJA" else 9999.0, 1),
                "distance_to_krishna_m": round(dist_water if city_id == "VJA" else 9999.0, 1),
                "land_cover_class": land_cover,
                "impervious_surface_ratio": impervious_ratio,
                "road_density_km_km2": road_density,
                "building_density": bldg_density,
                "historical_flood_count": hist_count,
                "historical_flood_frequency": hist_freq,
                "historical_flooded_area_pct": hist_area_pct,
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [poly_coords]
                }
            })

    return pd.DataFrame(rows)

def save_all_cities_spatial_layers():
    """Generate and save spatial layers for all 4 major Indian cities."""
    os.makedirs("data/processed", exist_ok=True)
    all_dfs = []

    for cid, spec in CITY_SPECS.items():
        df_city = generate_city_grid(cid)
        all_dfs.append(df_city)

        # Save city GeoJSON
        features = []
        for _, row in df_city.iterrows():
            props = row.to_dict()
            geom = props.pop("geometry")
            features.append({
                "type": "Feature",
                "id": props["grid_id"],
                "geometry": geom,
                "properties": props
            })
        geojson_data = {
            "type": "FeatureCollection",
            "name": f"DrainSense_{cid}_500m_Grid",
            "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            "features": features
        }
        with open(f"data/processed/{cid.lower()}_grid_500m.json", "w") as f:
            json.dump(geojson_data, f, indent=2)

        # Also copy VJA to default vijayawada_grid_500m.json for backward compatibility
        if cid == "VJA":
            with open("data/processed/vijayawada_grid_500m.json", "w") as f:
                json.dump(geojson_data, f, indent=2)

        print(f"Generated {len(df_city)} grid cells for {spec['name']} ({cid}).")

    combined_df = pd.concat(all_dfs, ignore_index=True)
    combined_tabular = combined_df.drop(columns=["geometry"])
    combined_tabular.to_csv("data/processed/all_cities_grid_features.csv", index=False)
    
    # Save VJA tabular for backward compatibility
    vja_tabular = combined_tabular[combined_tabular["city_id"] == "VJA"]
    vja_tabular.to_csv("data/processed/vijayawada_grid_features.csv", index=False)

    print(f"Saved total {len(combined_df)} spatial grid cells across {len(CITY_SPECS)} cities.")
    return combined_df

if __name__ == "__main__":
    save_all_cities_spatial_layers()
