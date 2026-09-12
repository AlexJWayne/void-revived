#!/usr/bin/env ruby -wKU

require 'rubygems'
require 'json'

stages = {}
Dir.entries('Assets/Stages').each do |filename|
  next if filename =~ /^\./
  stage = JSON.parse(File.read("Assets/Stages/#{filename}"))
  if stage['nebulas'].any?
    puts "#{filename.split('.').first} (#{stage['nebulas'].size})"
  end
end

stages