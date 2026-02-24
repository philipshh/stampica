from PIL import Image
import sys

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path)
        img = img.resize((1, 1))
        color = img.getpixel((0, 0))
        return '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2])
    except Exception as e:
        return str(e)

print(get_dominant_color('/Users/filipsosevic/.gemini/antigravity/brain/0d16fff6-5bcc-4d40-8729-d79a43469cd0/uploaded_image_1764023079300.png'))
