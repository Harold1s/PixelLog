import re
with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# Replace any malformed classNames
content = re.sub(r'className="flex gap-4 overflow-x-auto pb-4 snap-x"\s+className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar"', 'className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar"', content)
# And just in case style was replaced next to className:
content = re.sub(r'className="([^"]+)"\s+className="([^"]+)"', r'className="\1 \2"', content)

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)
