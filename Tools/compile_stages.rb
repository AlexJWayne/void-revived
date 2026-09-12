#!/usr/bin/env ruby -wKU

require 'rubygems'
require 'json'
require 'builder'
require 'activesupport'

output = ''
xml = Builder::XmlMarkup.new(:indent => 2, :target => output)

xml.instruct!
xml << '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
xml << "\n"
xml.plist(:version => '1.0') do
  xml.dict do
    Dir.entries('Assets/Stages').each do |filename|
      next unless filename =~ /\.json$/
      data = JSON.parse(File.read("Assets/Stages/#{filename}")).with_indifferent_access
      
      xml.key filename.gsub('.json', '')
      xml.dict do
        xml.key 'tier'
        xml.integer data[:tier]
        
        xml.key 'zone'
        xml.integer data[:zone]
        
        xml.key 'connections'
        xml.array do
          data[:connections].each do |stage_name|
            xml.string stage_name
          end
        end
        
        xml.key 'description'
        xml.string data[:description]
        
        xml.key 'galaxyPosition'
        xml.dict do
          xml.key 'x'
          xml.integer data[:galaxyLocation][0]
          xml.key 'y'
          xml.integer data[:galaxyLocation][1]
        end

        xml.key 'hypergatePosition'
        xml.dict do
          xml.key 'x'
          xml.integer data[:hypergate][:location][0]
          xml.key 'y'
          xml.integer data[:hypergate][:location][1]
        end
        
        xml.key 'music'
        xml.string data[:music]
        
        xml.key 'planets'
        xml.array
        
        xml.key 'backgroundColor'
        xml.dict do
          xml.key 'r'
          xml.integer 0
          xml.key 'g'
          xml.integer 0
          xml.key 'b'
          xml.integer 0
        end
        
        xml.key 'planets'
        xml.array do
          if data[:planets]
            data[:planets].each do |planet|
              xml.dict do
                xml.key 'image'
                xml.string "Planet.#{planet[:name]}.png"
                
                xml.key 'size'
                xml.integer planet[:radius].to_i * 2
                
                xml.key 'position'
                xml.dict do
                  xml.key 'x'
                  xml.integer planet[:location][0]
                  xml.key 'y'
                  xml.integer planet[:location][1]
                end
              end
            end
          end
        end
        
        xml.key 'nebulas'
        xml.array do
          if data[:nebulas]
            data[:nebulas].each do |nebula|
              xml.dict do
                xml.key 'texture'
                xml.string nebula[:texture]
                
                xml.key 'position'
                xml.dict do
                  xml.key 'x'
                  xml.integer nebula[:location][0]
                  xml.key 'y'
                  xml.integer nebula[:location][1]
                end
                
                xml.key 'size'
                xml.integer nebula[:radius].to_i * 2
                
                xml.key 'opacity'
                xml.real nebula[:opacity]
                
                xml.key 'drag'
                xml.real nebula[:drag]
                
                xml.key 'energyRegen'
                xml.real nebula[:energyRegen]
                
                xml.key 'shieldRegen'
                xml.real nebula[:shieldRegen]
                
                xml.key 'armorRegen'
                xml.real nebula[:armorRegen]
              end
            end
          end
        end
        
        xml.key 'enemies'
        xml.array do
          data[:enemies].each do |enemy|
            xml.dict do
              xml.key 'loadout'
              xml.string enemy[:name]
              
              xml.key 'optional'
              enemy[:optional] ? xml.true : xml.false
              
              case enemy[:mode]
              when 'pos'
                if Math.sqrt(enemy[:location][0]**2 + enemy[:location][1]**2) > 80.0
                  raise "In stage #{filename}: Enemy '#{enemy[:name]}' position outside play area at (#{enemy[:location].join(',')})"
                end
                
                xml.key 'position'
                xml.dict do
                  xml.key 'x'
                  xml.integer enemy[:location][0]
                  xml.key 'y'
                  xml.integer enemy[:location][1]
                end
                
                xml.key 'firstTimeOnly'
                enemy[:firstOnly] ? xml.true : xml.false
                
                xml.key 'chance'
                xml.real enemy[:chance]
                
              when 'qty'
                xml.key 'qty'
                xml.string "#{enemy[:qty][0]}-#{enemy[:qty][1]}"
                
              end
              
            end
          end
        end
      end
    end
  end
end


File.open('Stages.plist', 'w+') do |f|
  f.write output
end

puts "Complied all stage to Stages.plist"