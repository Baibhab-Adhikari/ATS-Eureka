import matplotlib.pyplot as plt

# Data for the pie chart
labels = ["Global Job Applications (per posting)", "India Job Postings (daily)", "India Festive Season Job Postings"]
sizes = [250, 8746, 4000]  # Sample values based on reports
colors = ["#ff9999", "#66b3ff", "#99ff99"]

# Create the pie chart
plt.figure(figsize=(8, 8))
wedges, texts, autotexts = plt.pie(
    sizes, labels=labels, autopct="%1.1f%%", colors=colors, startangle=140, 
    textprops={'fontsize': 12}, pctdistance=0.6
)

# Customize text inside the pie
for text in texts:
    text.set(size=12, color="black")
for autotext in autotexts:
    autotext.set(size=14, color="white", fontweight="bold")  # Inside text customization

plt.title("Global and Indian Job Market Data (Daily)", fontsize=14, fontweight="bold")
plt.show()
