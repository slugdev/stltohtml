/*Copyright(c) 2018, slugdev
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met :
1. Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.
3. All advertising materials mentioning features or use of this software
must display the following acknowledgement :
This product includes software developed by slugdev.
4. Neither the name of the slugdev nor the
names of its contributors may be used to endorse or promote products
derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY SLUGDEV ''AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED.IN NO EVENT SHALL SLUGDEV BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/

#include <vector>
#include <string>
#include <iostream>
#include <fstream>
#include <sstream>
#include <algorithm>
#include "mainjs.h"
char* htmlpre =
"<html>\n"
"   <canvas style=\"width:100%; height:100%;\" id = 'glcanvas'>< /canvas>"
"   <script>\n";

char* htmlpost =
"   </script>\n"
"</html>\n";


void read_stl_binary(std::string file_name, std::vector<double>& nodes, std::vector<double>& normals)
{
	/*
	according to wikipedia ...
	UINT8[80] – Header
	UINT32 – Number of triangles
	foreach triangle
	REAL32[3] – Normal vector
	REAL32[3] – Vertex 1
	REAL32[3] – Vertex 2
	REAL32[3] – Vertex 3
	UINT16 – Attribute byte count
	end	*/

	std::ifstream file(file_name, std::ios::in | std::ios::binary);
	if (!file)
	{
		std::cout << "Failed to open binary stl file: " << file_name << "\n";
		exit(1);
	}

	char header[80];
	file.read(header, 80);

	uint32_t tris = 0;
	file.read((char*)(&tris),sizeof(uint32_t));
	nodes.resize(tris * 9);
	normals.resize(tris * 9);
	for (uint32_t i = 0; i < tris; i++)
	{
		float_t  n[3], pts[9];
		uint16_t att;
		file.read((char*)(n), sizeof(float_t) * 3);
		file.read((char*)(pts), sizeof(float_t) * 9);
		file.read((char*)(&att), sizeof(uint16_t));
		for (int j = 0; j < 9; j++)
			nodes[i * 9 + j] = pts[j];
		for (int j = 0; j < 9; j++)
			normals[i * 9 + j] = n[j%3];

	}
	file.close();
}

void read_stl_ascii(std::string file_name, std::vector<double>& nodes, std::vector<double>& normals)
{
	std::ifstream file;
	file.open(file_name);
	if (!file)
	{
		std::cout << "Failed to open ascii stl file: " << file_name << "\n";
		exit(1);
	}
	std::string line;
	while (std::getline(file, line))
	{
		std::istringstream iss(line);
		std::string vert, facet;
		double  x, y, z;
		if ((iss >> vert >> x >> y >> z) && vert == "vertex")
		{
			nodes.push_back(x);
			nodes.push_back(y);
			nodes.push_back(z);
		}
	}
	file.close();
	file.open(file_name);
	while (std::getline(file, line))
	{
		std::istringstream iss(line);
		std::string vert, facet;
		double  x, y, z;
         if ((iss >> facet >> vert >> x >> y >> z) && vert == "normal")
		{
			normals.push_back(x);normals.push_back(y);normals.push_back(z);
			normals.push_back(x); normals.push_back(y); normals.push_back(z);
			normals.push_back(x); normals.push_back(y); normals.push_back(z);
		}
	}
	file.close();
}

void read_stl(std::string file_name,std::vector<double>& nodes, std::vector<double>& normals)
{
	// inspired by: https://stackoverflow.com/questions/26171521/verifying-that-an-stl-file-is-ascii-or-binary
	std::ifstream file_test(file_name, std::ifstream::ate | std::ifstream::binary);
	if (!file_test)
	{
		std::cout << "Failed to open stl file: " << file_name << "\n";
		exit(1);
	}

	auto file_size = file_test.tellg();
	file_test.close();

	// The minimum size of an empty ASCII file is 15 bytes.
	if (file_size < 15)
	{
		std::cout << "Invalid stl file: " << file_name << "\n";
		exit(1);
	}

	std::ifstream file(file_name, std::ios::in | std::ios::binary);
	if (!file)
	{
		std::cout << "Failed to open stl file: " << file_name << "\n";
		exit(1);
	}

	char first[5];
	file.read(first, 5);
	file.close();
	if (first[0] == 's' &&
		first[1] == 'o' &&
		first[2] == 'l' &&
		first[3] == 'i' &&
		first[4] == 'd')
	{
		read_stl_ascii(file_name, nodes, normals);
	}
	else
	{
		read_stl_binary(file_name,nodes,normals);
	}
}


void export_html_mesh(std::string file_name, std::vector<double> nodes, std::vector<double> normals, double color[3],bool color_by_z)
{
	std::ofstream html_file;
	html_file.open(file_name);
	if (!html_file)
		return;

	// header info
	html_file << htmlpre;
	html_file << "var vertices = [\n";
	for (int i = 0; i < nodes.size() / 9; i++)
	{
		html_file << nodes[i * 9 + 0] << ", " << nodes[i * 9 + 1] << ", " << nodes[i * 9 + 2] << ", " << 
			nodes[i * 9 + 3] << ", " << nodes[i * 9 + 4] << ", " << nodes[i * 9 + 5] << ", " <<
			nodes[i * 9 + 6] << ", " << nodes[i * 9 + 7] << ", " << nodes[i * 9 + 8] << ",\n";
	}
	html_file << "]\n\n";

	int cnt = 0;
	html_file << "var indices = [\n";
	for (int i = 0; i < nodes.size() / 9; i++)
	{
		html_file << cnt + 0 << ", " << cnt + 1 << ", " << cnt + 2 << ",\n";
		cnt += 3;
	}
	html_file << "]\n\n";

	html_file << "var normals = [\n";
	for (int i = 0; i < normals.size() / 3; i++)
	{
		html_file << normals[i*3 + 0] << ", " << normals[i * 3 + 1] << ", " << normals[i * 3 + 2] << ",\n";
	}
	html_file << "]\n\n";

	if (!color_by_z)
	{
		html_file << "var colors = [\n";
		for (int i = 0; i < nodes.size() / 9; i++)
		{
			html_file << color[0] << ", " << color[1] << ", " << color[2] << ", " <<
				color[0] << ", " << color[1] << ", " << color[2] << ", " <<
				color[0] << ", " << color[1] << ", " << color[2] << ", " << "\n";
		}
		html_file << "]\n\n";
	}
	else
	{
		double targ_size = 3.0;
		html_file << "var colors = [\n";
		for (int i = 0; i < nodes.size() / 9; i++)
		{
			double z = nodes[i * 9 + 2];
			if (z <= 0.0)
			{
				color[0] = 1 - ((z + 3) / 3);
			}
			html_file << color[0] << ", " << color[1] << ", " << color[2] << ", ";
			html_file << color[0] << ", " << color[1] << ", " << color[2] << ", ";
			html_file << color[0] << ", " << color[1] << ", " << color[2] << ", " << "\n";
		}
		html_file << "]\n\n";
	}

	html_file << mainjs;
	html_file << htmlpost;
}

std::vector<double> rescale(std::vector<double> nodes_in)
{
	double minv[3] = { 0,0,0 };
	double maxv[3] = { 0,0,0 };
	std::vector<double> nodes_out = nodes_in;
	for (int i = 0; i < nodes_in.size()/3; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			if (i == 0 || minv[j] > nodes_in[i * 3 + j])
				minv[j] = nodes_in[i * 3 + j];

			if (i == 0 || maxv[j] < nodes_in[i * 3 + j])
				maxv[j] = nodes_in[i * 3 + j];
		}
	}

	double center[3] = {
		(maxv[0] + minv[0])*.5,
		(maxv[1] + minv[1])*.5,
		(maxv[2] + minv[2])*.5 };

	double targ_size = 3.0;
	double scales[3] = { targ_size / (maxv[0] - minv[0]), targ_size / (maxv[1] - minv[1]), targ_size / (maxv[2] - minv[2]) };

	double max_scale = std::max(std::max(scales[0], scales[1]), scales[3]);

	for (int i = 0; i < nodes_in.size() / 3; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			nodes_out[i * 3 + j] = max_scale*(nodes_in[i * 3 + j]- center[j]);
		}
	}
	return nodes_out;
}


int main(int arv, char* argc[])
{
	double tol = 1e-6;
	bool mergeplanar = false;
	std::string help = "stltohtml <stl_file> <html_file> [colorbyzheight | color <r g b>]\n";

	if (arv < 3)
	{
		std::cout << "ERROR: " << help;
		return 1;
	}

	std::string input_file = argc[1];
	std::string output_file = argc[2];
	int arg_cnt = 3;
	bool color_by_z = false;
	double color[3] = { 1,0,0 };
	while (arg_cnt < arv)
	{
		std::string cur_arg = argc[arg_cnt];
		if (cur_arg == "colorbyzheight")
		{
			color_by_z = true;
			std::cout << "Coloring verticies by z height\n";
		}
		else if (cur_arg == "color")
		{
			if (arv - arg_cnt < 3)
			{
				std::cout << "3 color parameters needed (r g b) \n";
				return 1;
			}
			color[0] = std::atof(argc[arg_cnt + 1]);
			std::cout << "Red set to " << color[0] << "\n";
			arg_cnt++;

			color[1] = std::atof(argc[arg_cnt + 1]);
			std::cout << "Green set to " << color[1] << "\n";
			arg_cnt++;

			color[2] = std::atof(argc[arg_cnt + 1]);
			std::cout << "Blue set to " << color[2] << "\n";
			arg_cnt++;
		}
		else
		{
			std::cout << "Unknown parameter " << cur_arg << "\n";
			return 1;
		}
		arg_cnt++;
	}

	std::vector<double> nodes, normals;
	read_stl(input_file,nodes, normals);
	if (nodes.size()/9 == 0)
	{
		std::cout << "No triangles found in stl file: " << input_file << "\n";
		return 1;
	}
	
	nodes = rescale(nodes);
	std::cout << "Read " << nodes.size() / 9 << " triangles from " << input_file << "\n";
	export_html_mesh(output_file, nodes,normals, color, color_by_z);
	std::cout << "Exported HTML file: " << output_file << "\n";
	return 0;
}


