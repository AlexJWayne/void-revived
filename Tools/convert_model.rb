#!/usr/bin/env ruby -wKU


class Obj
  class Vector
    attr_reader :x, :y, :z
    def initialize(x, y, z)
      @x = -x.to_f
      @y = z.to_f
      @z = y.to_f
    end
  end
  
  attr_reader :vertices, :normals, :faces
  
  def initialize(file_name = nil)
    if file_name
      parse file_name
      to_code
    else
      Dir.glob('Assets/Models/Ships/**/*.obj').each do |file|
        parse file
        to_code
      end
    end
  end
  
  def parse(file_name)
    file = File.read(file_name)
    
    @groups = {}
    current_group = nil
    
    @vertices = []
    @normals  = []
    @texels   = []
    
    line_counter = 0
    
    file.each do |line|
      case line
      when /^g\s+(.+)$/
        current_group = $1
        @groups[current_group] = []
      when /^v\s+([\-\d\.e]+)\s+([\-\d\.e]+)\s+([\-\d\.e]+)/
        @vertices << Vector.new($1, $2, $3)
      when /^vn\s+([\-\d\.e]+)\s+([\-\d\.e]+)\s+([\-\d\.e]+)/
        @normals  << Vector.new($1, $2, $3)
      when /^vt\s+([\-\d\.e]+)\s+([\-\d\.e]+)/
        @texels   << [$1.to_f, 1.0 - $2.to_f]
      when /^f/
        face_verts = []
        line.gsub(/^f\s+/, '').split(/\s+/).map { |v| v.split('/').map { |i| i.to_i  } }.each do |vert_desc|
          face_verts << {
            :position => @vertices[vert_desc[0]-1],
            :texel    => @texels[vert_desc[1]-1],
            :normal   => @normals[vert_desc[2]-1],
          }
        end
        
        if face_verts.size == 3
          @groups[current_group] << face_verts
        else
          raise "Found polygon with #{face_verts.size} vertices.  Only 3 verts per polygon are currently supported."
        end
      end
    end
  end
  
  def to_code
    @groups.each do |name, faces|
      template = ''
      
      template << faces.size.to_s
      template << "\n"
      
      face_verts = []
      faces.each do |face|
        face.each do |vertex|
          face_verts << vertex[:position].x
          face_verts << vertex[:position].y
          face_verts << vertex[:position].z
        end
      end
  
      template << face_verts.join(',')
      template << "\n"
      
      face_normals = []
      faces.each do |face|
        face.each do |vertex|
          face_normals << vertex[:normal].x
          face_normals << vertex[:normal].y
          face_normals << vertex[:normal].z
        end
      end
      
      template << face_normals.join(',')
      template << "\n"
      
      face_uv = []
      faces.each do |face|
        face.each do |vertex|
          face_uv << vertex[:texel][0]
          face_uv << vertex[:texel][1]
        end
      end
  
      template << face_uv.join(',')
      
      File.open("Assets/Models/Ships/vmdl/#{name}.vmdl", 'w+') do |f|
        f.write template
      end
      
      puts "Converted: #{name}"
    end
  end
  
end


Obj.new(ARGV.first)
  
