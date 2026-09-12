#!/usr/bin/env ruby -wKU

Dir.entries('Assets/Stages').each do |filename|
  puts "<string>#{filename.gsub('.json', '')}</string>"
end


