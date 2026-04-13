import os
import json
import shutil
import glob

# Source and target directories
source_dir = r"F:\AIホームページ制作\OPSM_site_folders\opsm-site"
target_dir = r"C:\Users\nr94f\.gemini\antigravity\scratch\opsm-portfolio-v2\assets"
base_dir = r"C:\Users\nr94f\.gemini\antigravity\scratch\opsm-portfolio-v2"

# 1. Sync assets (copy all files, skipping identical ones)
print("Synchronizing assets from F: drive...")
if os.path.exists(source_dir):
    # os.system(f'robocopy "{source_dir}" "{target_dir}" /E /IS /IT /W:0 /R:0') # Optional robocopy
    # using shell copy
    pass # we assume the user already did it or we can do it via powershell. 
    # Or I'll actually implement proper sync here
    for root, dirs, files in os.walk(source_dir):
        # Determine relative path
        rel_path = os.path.relpath(root, source_dir)
        dest_path = os.path.join(target_dir, rel_path)
        os.makedirs(dest_path, exist_ok=True)
        for file in files:
            src_file = os.path.join(root, file)
            dst_file = os.path.join(dest_path, file)
            if not os.path.exists(dst_file) or os.path.getmtime(src_file) - os.path.getmtime(dst_file) > 1:
                try:
                    shutil.copy2(src_file, dst_file)
                except Exception as e:
                    pass

print("Generating database JSON files...")
# 2. Update art_data.json
art_dir = os.path.join(target_dir, "art", "gallery")
valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.jfif', '.avif', '.gif'}
art_files = []

if os.path.exists(art_dir):
    for f in os.listdir(art_dir):
        full_path = os.path.join(art_dir, f)
        if os.path.isfile(full_path):
            ext = os.path.splitext(f)[1].lower()
            if ext in valid_exts:
                art_files.append(f"assets/art/gallery/{f}")
    art_files.sort()

with open(os.path.join(target_dir, "art_data.json"), 'w', encoding='utf-8') as f:
    json.dump(art_files, f, ensure_ascii=False, separators=(',', ':'))

# 3. Update music_data.json
discography_dir = os.path.join(target_dir, "music", "discography")
music_list = []

if os.path.exists(discography_dir):
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
            
            if audio_file:
                music_list.append({
                    "title": title,
                    "imageFile": image_file,
                    "audioFile": audio_file
                })

# Sort by folder name (which starts with date)
music_list.sort(key=lambda x: x["title"])

with open(os.path.join(target_dir, "music_data.json"), 'w', encoding='utf-8') as f:
    json.dump(music_list, f, ensure_ascii=False, separators=(',', ':'))

print("Data synchronization complete!")
