import matplotlib.pyplot as plt
import numpy as np
import geopandas as gpd
import os
os.environ["SHAPE_RESTORE_SHX"] = "YES"

world = gpd.read_file("C:/Users/User/Desktop/ne_110m_admin_0_countries.shp")

# Given list of companies and their respective countries
companies = [
    ("DaXtra Technologies", "United Kingdom"),
    ("HireAbility", "United States"),
    ("Sovren", "United States"),
    ("Talentrackr", "India"),
    ("Textkernel", "Netherlands"),
    ("Rchilli", "United States"),
    ("Newton", "United States"),    
    ("Top Echelon (Patriot Software)", "United States"),
    ("JoinVision", "Austria"),
    ("RapidParser", "United States"),
    ("Zoho", "India"),
    ("Hiretual", "United States"),
    ("ResumeGrabber", "United States")
]

# Assign random market scores for visualization
company_names = [company[0] for compaany in companies]
market_scores = np.random.randint(50, 100, len(companies))

# Mapping countries to approximate latitude and longitude
locations = {
    "United Kingdom": (55.3781, -3.4360),
    "United States": (37.0902, -95.7129),
    "India": (20.5937, 78.9629),
    "Netherlands": (52.1326, 5.2913),
    "Austria": (47.5162, 14.5501)
}

# Prepare data for plotting
latitudes = [locations[company[1]][0] for company in companies]
longitudes = [locations[company[1]][1] for company in companies]

# Load world map
world = gpd.read_file('C:\\Users\\User\\Desktop\\ne_110m_admin_0_countries.shp')

# Plot the world map
fig, ax = plt.subplots(figsize=(12, 6))
world.plot(ax=ax, color='lightgrey')

# Scatter plot of company locations
scatter = ax.scatter(longitudes, latitudes, c=market_scores, cmap='coolwarm', edgecolors='black', s=100)

# Annotate companies on the map
for i, txt in enumerate(company_names):
    ax.annotate(txt, (longitudes[i], latitudes[i]), fontsize=8, ha='right')

plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.title("Global Distribution of Resume Parsing Companies")
plt.colorbar(scatter, label='Market Influence Score')
plt.show()

