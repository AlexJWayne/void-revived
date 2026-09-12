require 'rubygems'
require 'builder'

output = ''
x = Builder::XmlMarkup.new(:indent => 2, :target => output)

x.instruct!
x << "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\n"
x.plist :version => 1.0 do
  x.dict do  
    100.times do |i|
      x.key "Stage #{i}"
      x.dict do
        x.key 'music'
        x.string ''
        
        x.key 'galaxyPosition'
        x.dict do
          x.key 'x'
          x.integer 10 + (rand*460).round
          
          x.key 'y'
          x.integer 10 + (rand*251).round
        end
        
        x.key 'backgroundColor'
        x.dict do
          x.key 'r'
          x.integer 0
          
          x.key 'g'
          x.integer 0
          
          x.key 'b'
          x.integer 0
        end
        
        x.key 'hypergatePosition'
        x.dict do
          x.key 'x'
          x.integer 0
          
          x.key 'y'
          x.integer 0
        end
        
        x.key 'planets'
        x.array do
          x.key 'position'
          x.dict do
            x.key 'x'
            x.integer 10

            x.key 'y'
            x.integer 10
          end
          
          x.key 'image'
          x.string 'Planet.Moon.png'
          
          x.key 'size'
          x.integer 6
        end
        
        x.key 'enemies'
        x.array
        
        x.key 'connections'
        x.array
      end
    end
  end
end



puts output