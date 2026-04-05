import os
import json
import glob

base_dir = r"c:\Users\nr94f\.gemini\antigravity\scratch\opsm-portfolio"

# 1. Update art_data.json
art_dir = os.path.join(base_dir, "assets", "art")
valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.jfif', '.avif', '.gif'}
art_files = []

for f in os.listdir(art_dir):
    full_path = os.path.join(art_dir, f)
    if os.path.isfile(full_path):
        ext = os.path.splitext(f)[1].lower()
        if ext in valid_exts:
            art_files.append(f"assets/art/{f}")

art_files.sort()
art_out = os.path.join(base_dir, "assets", "art_data.json")
with open(art_out, 'w', encoding='utf-8') as f:
    json.dump(art_files, f, ensure_ascii=False, separators=(',', ':'))

# 2. Update music_data.json
discography_dir = os.path.join(base_dir, "assets", "music", "discography")
music_list = []

for folder in os.listdir(discography_dir):
    folder_path = os.path.join(discography_dir, folder)
    if os.path.isdir(folder_path):
        title = folder
        audio_file = ""
        image_file = ""
        suno_url = ""
        
        for file in os.listdir(folder_path):
            file_path = os.path.join(folder_path, file)
            ext = os.path.splitext(file)[1].lower()
            
            if ext in {'.mp3', '.wav', '.m4a'} and not audio_file:
                audio_file = f"assets/music/discography/{folder}/{file}"
            elif ext in valid_exts and not image_file:
                image_file = f"assets/music/discography/{folder}/{file}"
            elif ext == '.url':
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as url_f:
                        for line in url_f:
                            if line.startswith('URL='):
                                suno_url = line.strip().split('=', 1)[1]
                                break
                except Exception:
                    pass
        
        if audio_file:
            entry = {
                "title": title,
                "imageFile": image_file,
                "audioFile": audio_file
            }
            if suno_url:
                entry["sunoUrl"] = suno_url
            music_list.append(entry)

# Sort by folder name (which starts with date)
music_list.sort(key=lambda x: x["title"])

music_out = os.path.join(base_dir, "assets", "music_data.json")
with open(music_out, 'w', encoding='utf-8') as f:
    json.dump(music_list, f, ensure_ascii=False, separators=(',', ':'))

print("JSON files updated successfully.")
