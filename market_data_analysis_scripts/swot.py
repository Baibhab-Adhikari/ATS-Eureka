import matplotlib.pyplot as plt
from wordcloud import WordCloud

features_text = ("Smart parsing multi-lang ranking AI resume extraction scoring NLP magic basic matching "
                 "multilingual semantic search enrichment ATS integration simple ATS HR suite candidate management "
                 "CRM scheduling AI sourcing market insights basic extraction parsing")

wc_features = WordCloud(width=600, height=600, background_color='white', colormap='Purples', 
                        collocations=False, prefer_horizontal=1.0).generate(features_text)

plt.figure(figsize=(6, 6))
plt.imshow(wc_features, interpolation='bilinear')
plt.axis('off')
plt.title("Main Features", fontsize=20, color='purple', fontweight='bold')
plt.savefig("features_wordcloud.png", dpi=300, bbox_inches='tight')
plt.show()




