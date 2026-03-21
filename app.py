from flask import Flask, render_template, request, jsonify
import json, struct, os, glob, ctypes, sys
from breeding import calc_adjusted, calc_all_combos, MONSTER_DATA

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Save file reader  (Documents\KoeiTecmo\mfdx_en\*.sav)
# ---------------------------------------------------------------------------
SAVE_DIR = os.path.join(os.path.expanduser("~"), "Documents", "KoeiTecmo", "mfdx_en")

def find_save_files():
    pattern = os.path.join(SAVE_DIR, "*.sav")
    return sorted(glob.glob(pattern))

def read_monster_from_save(path):
    """
    Try to parse a monster from the MR2 DX save file.
    Offsets discovered via Cheat Engine community tables (_GetMon base):
      +0x00  name (16 bytes, ASCII)
      +0x10  main breed (1 byte index)
      +0x11  sub  breed (1 byte index)
      +0x20  Life    (2 bytes LE)
      +0x22  Power   (2 bytes LE)
      +0x24  Intel   (2 bytes LE)
      +0x26  Skill   (2 bytes LE)
      +0x28  Speed   (2 bytes LE)
      +0x2A  Defense (2 bytes LE)
    NOTE: the save format is binary; these offsets are approximate and may need
    tuning once tested against a real save. The app falls back gracefully.
    """
    try:
        with open(path, "rb") as f:
            data = f.read()

        # Search for a recognisable monster block header (heuristic):
        # look for stat values that look plausible (10-999) at candidate offsets.
        monsters = []
        # Scan every 0x200 boundary for monster slots
        for base in range(0, len(data) - 0x50, 0x200):
            try:
                name_raw = data[base:base+16]
                name = name_raw.split(b'\x00')[0].decode('ascii', errors='replace').strip()
                if not name or not all(32 <= ord(c) < 128 for c in name):
                    continue
                main_idx = data[base+0x10]
                sub_idx  = data[base+0x11]
                stats = struct.unpack_from('<6H', data, base+0x20)
                if all(10 <= s <= 999 for s in stats) and main_idx < len(BREED_NAMES) and sub_idx < len(BREED_NAMES):
                    monsters.append({
                        "name": name,
                        "main": BREED_NAMES[main_idx],
                        "sub":  BREED_NAMES[sub_idx],
                        "stats": list(stats)   # Life Pow Int Skl Spd Def
                    })
            except Exception:
                continue
        return monsters
    except Exception as e:
        return []

BREED_NAMES = [
    "Pixie","Dragon","Centaur","ColorPandora","Beaclon","Henger","Wracky","Golem",
    "Zuum","Durahan","Arrow Head","Tiger","Hopper","Suezo","Baku","Gali","Kato",
    "Zilla","Bajarl","Mew","Phoenix","Ghost","Metalner","Sponge","Jell","Hare",
    "Baddies","Mono Eye","Plant","Monol","Naga","Worm","Gitan","???","Mock","Joker",
    "Gaboo","Jill","Undine","Niton","Mock","Zan","Ducken","Psiroller","Baronrang",
    "Poritoka","Sueki Suezo","???","Akwi","Orion","Hachitaro","Eared Mew","Puki",
    "Ripper"
]

@app.route("/")
def index():
    saves = find_save_files()
    return render_template("index.html", saves=saves)

@app.route("/api/saves")
def api_saves():
    saves = find_save_files()
    return jsonify(saves)

@app.route("/api/read_save", methods=["POST"])
def api_read_save():
    path = request.json.get("path", "")
    monsters = read_monster_from_save(path)
    return jsonify(monsters)

@app.route("/api/breeds")
def api_breeds():
    breeds = sorted(MONSTER_DATA.keys())
    return jsonify(breeds)

@app.route("/api/combine", methods=["POST"])
def api_combine():
    data = request.json
    p1 = data["parent1"]
    p2 = data["parent2"]

    result = calc_all_combos(
        main1=p1["main"], sub1=p1["sub"], stats1=p1["stats"],
        main2=p2["main"], sub2=p2["sub"], stats2=p2["stats"]
    )
    return jsonify(result)

@app.route("/api/adjusted", methods=["POST"])
def api_adjusted():
    d = request.json
    adj, order = calc_adjusted(d["main"], d["sub"], d["stats"])
    return jsonify({"adjusted": adj, "order": order})

if __name__ == "__main__":
    print("=" * 60)
    print("  MR2 Breeding Calculator — rodando em http://127.0.0.1:5000")
    print("=" * 60)
    app.run(debug=False, port=5000)
