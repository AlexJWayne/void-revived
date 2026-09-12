#!/usr/bin/env ruby -wKU

require 'rubygems'
require 'json'

def load_stage(name)
  JSON.parse(File.read("Assets/Stages/#{name}.json"))
end

def zone_to_race(zone)
  case zone.to_i
    when 0: 'Uninhabited'
    when 1: 'Cyber'
    when 2: 'Crystal'
    when 3: 'Organic'
    when 4: 'Energy'
  end
end

if ARGV.empty?
  puts "Usage\n  ./reuse_stage.rb StageName"
else
  
  target_stage = ARGV.shift
  target_stage_data = JSON.parse(File.read("Assets/Stages/#{target_stage}.json"))
  tier = target_stage_data['tier'].to_i

  puts "\n\nTHIS WILL OVERWRITE THE STAGE: #{target_stage} (#{zone_to_race target_stage_data['zone']})\n\n"
  
  possible_stages = {}
  Dir.entries('Assets/Stages').each do |filename|
    name = filename.split('.').first
    next if name.nil?
    data = load_stage(name)
    
    if data['tier'].to_i == tier && data['zone'] != target_stage_data['zone'] && data['zone'].to_i != 0
      possible_stages[name.downcase] = data
    end
  end
  
  possible_stages.collect do |k, v|
    puts "  #{k.capitalize} (#{zone_to_race v['zone']})"
  end
  puts
  
  source_stage_data = nil
  while source_stage_data.nil?
    print "Choose a stage to copy: "
    result = gets.chomp.downcase
    source_stage_data = possible_stages[result]
  end
  
  target_stage_data['enemies'] = source_stage_data['enemies']
  target_stage_data['planets'] = source_stage_data['planets']
  target_stage_data['nebulas'] = source_stage_data['nebulas']
  target_stage_data['hypergate'] = source_stage_data['hypergate']
  
  find    = zone_to_race(source_stage_data['zone'])
  replace = zone_to_race(target_stage_data['zone'])
  json = target_stage_data.to_json.gsub(find, replace)
  
  File.open("Assets/Stages/#{target_stage}.json", 'w') do |f|
    f.write json
  end
  
  puts
  puts "Copied to stage #{target_stage}.json"
  puts '-'*80
end