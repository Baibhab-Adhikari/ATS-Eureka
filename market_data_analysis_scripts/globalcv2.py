import matplotlib.pyplot as plt
import numpy as np

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

# Extract unique companies and assign random values for visualization (e.g., market influence score)
company_names = [company[0] for company in companies]
market_scores = np.random.randint(50, 100, len(companies))

# Create a horizontal bar chart for company influence
plt.figure(figsize=(12, 6))
plt.barh(company_names, market_scores, color='lightgreen', edgecolor='black')
plt.xlabel("Market Influence Score")
plt.ylabel("Company")
plt.title("Market Influence of Resume Parsing Companies")
plt.grid(axis='x', linestyle='--', alpha=0.7)

# Display the bar chart
plt.show()
