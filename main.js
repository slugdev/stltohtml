// Creating a canvas
var canvas = document.getElementById('glcanvas');
gl = canvas.getContext('experimental-webgl');
var ext = gl.getExtension('OES_element_index_uint');

// set the canvas size based on the html client size
canvas.width = document.body.clientWidth; 
canvas.height = document.body.clientHeight;

// Defining and storing the geometry
// Create and store data into vertex buffer
var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Create and store data into color buffer
var color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// Create and store data into normal buffer
var normal_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

// Create and store data into index buffer
var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

/*=================== SHADERS =================== */ 
var vertCode = 'attribute vec3 position;' +
   'uniform mat4 Pmatrix;' +
   'uniform mat4 Vmatrix;' +
   'uniform mat4 Mmatrix;' +
   'uniform mat4 Nmatrix;' +
   'attribute vec3 color;' +//the color of the point
   'attribute vec3 normal;' +//the normal of the point
   'varying vec3 vColor;' +
   'varying vec3 vLighting;' +
   'void main(void) ' +//pre-built function
   '{' +
      'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);' +
      'vec3 ambientLight = vec3(0.3, 0.3, 0.3);' +
      'vec3 directionalLightColor = vec3(1, 1, 1);' +
      'vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));' +
      'vec4 transformedNormal = Nmatrix * vec4(normal, 1.0);' +
      'float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);' +
      'vColor = color;' +
	  'vLighting = ambientLight + (directionalLightColor * directional);' +
   '}';

var fragCode = 'precision mediump float;' +
   'varying vec3 vColor;' +
   'varying vec3 vLighting;' +
   'void main(void) {' +
      'gl_FragColor = vec4(vColor * vLighting,1.);' +
   '}';

var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

var shaderprogram = gl.createProgram();
gl.attachShader(shaderprogram, vertShader);
gl.attachShader(shaderprogram, fragShader);
gl.linkProgram(shaderprogram);

/*======== Associating attributes to vertex shader =====*/
var _Pmatrix = gl.getUniformLocation(shaderprogram, "Pmatrix");
var _Vmatrix = gl.getUniformLocation(shaderprogram, "Vmatrix");
var _Mmatrix = gl.getUniformLocation(shaderprogram, "Mmatrix");
var _Nmatrix = gl.getUniformLocation(shaderprogram, "Nmatrix");

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var _position = gl.getAttribLocation(shaderprogram, "position");
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(_position);

gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
var _color = gl.getAttribLocation(shaderprogram, "color");
gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(_color);

gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
var _normal = gl.getAttribLocation(shaderprogram, "normal");
gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(_normal);

gl.useProgram(shaderprogram);

/*==================== MATRIX ====================== */

function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle * .5) * Math.PI / 180);//angle*.5
    return [
       0.5 / ang, 0, 0, 0,
       0, 0.5 * a / ang, 0, 0,
       0, 0, -(zMax + zMin) / (zMax - zMin), -1,
       0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
    ];
}

var proj_matrix = get_projection(40, canvas.width / canvas.height, 1, 100);
var mo_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var no_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

view_matrix[14] = view_matrix[14] - 6;

/*================= Mouse events ======================*/

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;

var mouseDown = function (e) {
    drag = true;
    old_x = e.pageX, old_y = e.pageY;
    e.preventDefault();
    return false;
};

var mouseUp = function (e) {
    drag = false;
};

var mouseMove = function (e) {
    if (!drag) return false;
    dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width,
    dY = (e.pageY - old_y) * 2 * Math.PI / canvas.height;
    THETA += dX;
    PHI += dY;
    old_x = e.pageX, old_y = e.pageY;
    e.preventDefault();
};

canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mouseup", mouseUp, false);
canvas.addEventListener("mouseout", mouseUp, false);
canvas.addEventListener("mousemove", mouseMove, false);

// https://github.com/toji/gl-matrix - although do I really need to attribute a transpose?
function transpose(out, a)
{
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        let a01 = a[1], a02 = a[2], a03 = a[3];
        let a12 = a[6], a13 = a[7];
        let a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    }
    else
    {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }

    return out;
}

// https://github.com/toji/gl-matrix - nice that they used raw arrays
function invert(out, a)
{
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
}

/*=========================rotation================*/
function rotateX(m, angle)
{
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1] = m[1] * c - m[2] * s;
    m[5] = m[5] * c - m[6] * s;
    m[9] = m[9] * c - m[10] * s;

    m[2] = m[2] * c + mv1 * s;
    m[6] = m[6] * c + mv5 * s;
    m[10] = m[10] * c + mv9 * s;
}

function rotateY(m, angle)
{
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c * m[0] + s * m[2];
    m[4] = c * m[4] + s * m[6];
    m[8] = c * m[8] + s * m[10];

    m[2] = c * m[2] - s * mv0;
    m[6] = c * m[6] - s * mv4;
    m[10] = c * m[10] - s * mv8;
}

// Drawing 
var THETA = 0,
PHI = 0;
var time_old = 0;

var animate = function (time) {
    var dt = time - time_old;

    if (!drag) {
        dX *= AMORTIZATION, dY *= AMORTIZATION;
        THETA += dX, PHI += dY;
    }

    //set model matrix to I4

    mo_matrix[0] = 1, mo_matrix[1] = 0, mo_matrix[2] = 0,
    mo_matrix[3] = 0,

    mo_matrix[4] = 0, mo_matrix[5] = 1, mo_matrix[6] = 0,
    mo_matrix[7] = 0,

    mo_matrix[8] = 0, mo_matrix[9] = 0, mo_matrix[10] = 1,
    mo_matrix[11] = 0,

    mo_matrix[12] = 0, mo_matrix[13] = 0, mo_matrix[14] = 0,
    mo_matrix[15] = 1;

    rotateY(mo_matrix, THETA);
    rotateX(mo_matrix, PHI);

    invert(no_matrix, mo_matrix);
    transpose(no_matrix, no_matrix);

    time_old = time;
    gl.enable(gl.DEPTH_TEST);

    // gl.depthFunc(gl.LEQUAL);

    gl.clearColor(0.5, 0.5, 0.5, 0.9);
    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix);
    gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
    gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);
    gl.uniformMatrix4fv(_Nmatrix, false, no_matrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);

    window.requestAnimationFrame(animate);
}
animate(0);