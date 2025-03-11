import matplotlib.pyplot as plt

# Data points
years = [2018, 2023, 2028, 2031]
market_size = [10.0, 16.3, 28.0, 43.7]  # In billion dollars

# Create the figure and axis
plt.figure(figsize=(8, 6))

# Plot the data
plt.plot(years, market_size, marker='o', linestyle='-', color='royalblue', linewidth=2, markersize=8, label="Market Growth")

# Highlight each data point
for i, txt in enumerate(market_size):
    plt.text(years[i], market_size[i] + 1, f"${txt}B", fontsize=10, ha='center', fontweight='bold')

# Labels and title
plt.xlabel("Year", fontsize=12)
plt.ylabel("Market Size (in billion $)", fontsize=12)
plt.title("Resume Parsing Market Growth Projection", fontsize=14, fontweight="bold")
plt.grid(True, linestyle="--", alpha=0.5)

# Show legend
plt.legend()
plt.show()
