#!/usr/bin/env ruby -wKU

require 'rubygems'
require 'plist'
require 'json'

CHIT_MAX = 10.0
CHIT_MIN = 1.0

TIER_FACTOR = {
  0 => 0.5,
  1 => 0.5,
  2 => 1.0,
  3 => 2.0,
  4 => 4.0,
  5 => 8.0,
}

LOADOUTS = Plist.parse_xml(File.read('Enemies.plist'))

def load_stage(name)
  JSON.parse(File.read("Assets/Stages/#{name}"))
end

def credits_for_enemy(name, tier)
  if LOADOUTS[name]
    max_chits = LOADOUTS[name]['loot']['credits']['max'].to_f
    min_chits = LOADOUTS[name]['loot']['credits']['min'].to_f
    
    (max_chits + min_chits)/2 * (CHIT_MAX + CHIT_MIN)/2 * TIER_FACTOR[tier]
  else
    raise "Could not find enemy loadout for #{name}"
  end
end

def items_for_tier(name, type, tier)
  non_credit_loot_tables = LOADOUTS[name]['loot'].find { |k, v| k !~ /credits/ }
  return 0 if non_credit_loot_tables.nil?
  
  race = non_credit_loot_tables.first.split(' ').first
  table_key = "#{race} #{type == :equipment ? 'Equipment ' : ''}Tier #{tier}"
  table = LOADOUTS[name]['loot'][table_key]
  
  if table
    table['qty'].to_f * table['chance'].to_f
  else
    0
  end
end

puts %w( EnemyName Tier AverageCredits T1Weapons T2Weapons T3Weapons T4Weapons T5Weapons T1Equipment T2Equipment T3Equipment T4Equipment T5Equipment ).join("\t")

Dir.entries('Assets/Stages').each do |filename|
  credits = 0
  weapons = {
    1 => 0.0,
    2 => 0.0,
    3 => 0.0,
    4 => 0.0,
    5 => 0.0,
  }
  equipment = {
    1 => 0.0,
    2 => 0.0,
    3 => 0.0,
    4 => 0.0,
    5 => 0.0,
  }
  
  next unless filename.split('.').last == 'json'
  stage_data = load_stage(filename)
  enemies = stage_data['enemies']
  
  enemies.each do |enemy|
    if enemy['mode'] == 'pos'
      qty = 1
    else
      qty = (enemy['qty'][0].to_f + enemy['qty'][1])/2
    end
    
    credits += credits_for_enemy(enemy['name'], stage_data['tier'].to_i) * qty
    
    1.upto 5 do |i|
      weapons[i]   += items_for_tier(enemy['name'], :weapons,   i) * qty
      equipment[i] += items_for_tier(enemy['name'], :equipment, i) * qty
    end
  end
  
  puts [
    filename.split('.').first,
    stage_data['tier'],
    credits,
    weapons[1],
    weapons[2],
    weapons[3],
    weapons[4],
    weapons[5],
    equipment[1],
    equipment[2],
    equipment[3],
    equipment[4],
    equipment[5],
  ].join("\t")
end