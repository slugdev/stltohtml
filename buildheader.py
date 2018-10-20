
f_in = open("main.js",'r')
f_out = open("mainjs.h",'w')
f_out.write('#pragma once \n\n')
f_out.write('char* mainjs = ')
for n in f_in:
    f_out.write('\"' + n.rstrip().replace('\"','\\\"') + '\\n\"\n')
f_out.write(';\n')  
f_in.close()
