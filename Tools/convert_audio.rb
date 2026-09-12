#!/usr/local/bin/ruby

path = ARGV.first.gsub(/\/$/, '')
bits = ARGV[1] || '16'

Dir.entries(path).each do |filename|
  if filename =~ /\.wav$/
    `/usr/bin/afconvert -f caff -d LEI#{bits} #{path}/#{filename} #{path}/#{filename.gsub '.wav', '.caf'}`
    `rm -f #{path}/#{filename}`
    puts "Converted: #{filename}"
  end
end