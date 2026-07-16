with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Remove duplicate deposits, gcash, settings tabs
seen = set()
new_lines = []
for line in lines:
    if any(x in line for x in [
        '{ id: "deposits"', 
        '{ id: "gcash"',
        '{ id: "settings"'
    ]):
        if line.strip() not in seen:
            seen.add(line.strip())
            new_lines.append(line)
        else:
            print("Removed duplicate:", line.strip())
    else:
        new_lines.append(line)

with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done!")
