import matplotlib.pyplot as plt

# Market Segmentation Data
labels = ["Large Enterprises", "SMEs", "Others"]
sizes = [70, 20, 10]  # Percentage distribution
colors = ["skyblue", "lightcoral", "purple"]
explode = (0.1, 0, 0)  # Highlight the 'Large Enterprises' segment

# Create Pie Chart
plt.figure(figsize=(8, 8))
plt.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors, explode=explode, startangle=140, shadow=True)
plt.title("Market Segmentation by Utilization")
plt.show()
