"""Copy only the selected legacy assets; do not modify the iOS tree."""
from pathlib import Path
import plistlib, json, shutil
root = Path(__file__).resolve().parents[2]
out = root / 'web-prototype/public/assets'
out.mkdir(parents=True, exist_ok=True)
ships = plistlib.load((root / 'ShipTypes.plist').open('rb'))
weapons = plistlib.load((root / 'Weapons.plist').open('rb'))
enemies = plistlib.load((root / 'Enemies.plist').open('rb'))
equipment = plistlib.load((root / 'Equipment.plist').open('rb'))
ship_names = ['Cyber Frigate', 'Cyber Light Fighter', 'Cyber Gun']
weapon_names = ['Vulcan Cannon', 'Mass Driver', 'Machine Gun', 'Genjuro Blaster']
data = {'ships': {k: ships[k] for k in ship_names}, 'weapons': {k: weapons[k] for k in weapon_names},
        'enemies': {k: {p: enemies[k][p] for p in ['type','aiType','guns','equipment']} for k in ship_names[1:]},
        'handicap': equipment['Handicap 20']['effects']}
(root/'web-prototype/src/legacy-data.json').write_text(json.dumps(data, indent=2)+'\n')
files = {'UIAtlas@2x.png', 'Projectiles.png', 'ShieldBubble.png', 'Hit.png', 'Explosion.Cyber.png', 'CyberThrust.png'}
for k in ship_names:
    s=ships[k]
    for m in s['model']:
        files.update([m['modelName']+'.vmdl', m['texture']])
    if s['thrusterModelName']: files.add(s['thrusterModelName']+'.vmdl')
manifest=[]
for name in sorted(files):
    paths=list((root/'Assets').rglob(name))
    if name == 'Projectiles.png': paths=[root/'Assets/Images/Content/Weapons/Projectiles/Projectiles.png']
    if len(paths)!=1: raise RuntimeError(f'Ambiguous/missing asset: {name}: {paths}')
    shutil.copyfile(paths[0],out/name)
    manifest.append({'file':name,'source':str(paths[0].relative_to(root))})
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Imported {len(files)} original assets and selected plist definitions.')
