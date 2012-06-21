module.exports= function(s, delim) {
    var quotecnt = 0,
        start    = 0,
        ret      = [];

    for(var i =0; i<s.length; i++) {
        var c = s[i];
        if(c=='"') {
            quotecnt+=1;
        }

        if((c==delim)&&((quotecnt%2)===0)) {
            ret.push(s.substring(start,i).trim().replace(/"/g,''));
            start=i+1;
        }
    }
    ret.push(s.substring(start,s.length).trim().replace(/"/g, ''));
    return ret;
};

