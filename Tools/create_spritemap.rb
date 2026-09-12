#!/usr/bin/env ruby -wKU

USAGE = <<-EOF

Usage:
  create_spritemap.rb path imageSize tilesAcross output.png

  
EOF
if ARGV.length != 4
  puts USAGE
end

path, imageSize, tilesAcross, output = ARGV

`montage -background "transparent" -depth 8 #{path.gsub(' ', '\\ ')}/*.tga -geometry #{imageSize}x#{imageSize} -tile #{tilesAcross}x#{tilesAcross} -matte -transparent "transparent" -depth 8 #{output}`