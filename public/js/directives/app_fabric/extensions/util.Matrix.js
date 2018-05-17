fabric.util.Matrix = function(m){
    this.m = m
};
fabric.util.Matrix.prototype.convertTransformMatrix1Dto2D =  function(){
    if(this.m.length!=6) throw "Invalid transform matrix";
    var m = this.m;
    this.m =  [
        [m[0],m[2],m[4]],
        [m[1],m[3],m[5]],
        [0,0,1]
    ]
    return this.m
};
fabric.util.Matrix.prototype.convertTransformMatrix2Dto1D =  function(){
    if(this.m.length!=3) throw "Invalid transform matrix";
    var m = [];
    for(var i = 0;i<this.m.length;i++){
        var row = this.m[i];
        if(row.length!=3) throw "Invalid transform matrix";
    }
    m[0]=this.m[0][0];
    m[1]=this.m[1][0];
    m[2]=this.m[0][1];
    m[3]=this.m[1][1];
    m[4]=this.m[0][2];
    m[5]=this.m[1][2];
    this.m = m;
    return this.m
};
fabric.util.Matrix.prototype.multiply = function(b) {
    b= b.m
    var a = this.m,
        aNumRows = a.length, aNumCols = a[0].length,
        bNumRows = b.length, bNumCols = b[0].length,
        m = new Array(aNumRows);  // initialize array of rows
    for (var r = 0; r < aNumRows; ++r) {
        m[r] = new Array(bNumCols); // initialize the current row
        for (var c = 0; c < bNumCols; ++c) {
            m[r][c] = 0;             // initialize the current cell
            for (var i = 0; i < aNumCols; ++i) {
                m[r][c] += a[r][i] * b[i][c];
            }
        }
    }
    return new fabric.util.Matrix(m);
}
