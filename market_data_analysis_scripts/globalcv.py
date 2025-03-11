import matplotlib.pyplot as plt
from collections import Counter

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

# Count occurrences of companies in each country
country_counts = Counter(country for _, country in companies)

# Extract data for plotting
countries = list(country_counts.keys())
counts = list(country_counts.values())

# Plot bar graph
plt.figure(figsize=(10, 6))
plt.bar(countries, counts, color='skyblue', edgecolor='black')
plt.xlabel("Countries")
plt.ylabel("Number of Resume Parsing Companies")
plt.title("Distribution of Resume Parsing Companies by Country")
plt.xticks(rotation=45)
plt.grid(axis='y', linestyle='--', alpha=0.7)

# Display the bar chart
plt.show()