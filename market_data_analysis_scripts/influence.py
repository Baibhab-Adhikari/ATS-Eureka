import matplotlib.pyplot as plt
import numpy as np

# Data
companies = [
    "ResumeGrabber", "Hiretual", "Zoho", "RapidParser", "JoinVision", 
    "Top Echelon (Patriot Software)", "Newton", "Rchilli", "Textkernel", 
    "Talentrackr", "Sovren", "HireAbility", "DaXtra Technologies"
]
scores = [90, 85, 60, 65, 50, 95, 70, 88, 58, 67, 75, 55, 60]

# Generate colors
colors = plt.cm.get_cmap("tab10", len(companies)).colors  # Use 'tab10' colormap

# Plot
fig, ax = plt.subplots(figsize=(12, 6))
bars = ax.barh(companies, scores, color=colors, edgecolor='black', alpha=0.85)

# Labels and Titles
ax.set_xlabel("Market Influence Score")
ax.set_title("Market Influence of Resume Parsing Companies")
ax.invert_yaxis()  # Highest score at the top

# Add value labels
for bar, score in zip(bars, scores):
    ax.text(bar.get_width() - 5, bar.get_y() + bar.get_height()/2, str(score),
            va='center', ha='right', fontsize=10, color='white', fontweight='bold')

# Display
plt.show()
