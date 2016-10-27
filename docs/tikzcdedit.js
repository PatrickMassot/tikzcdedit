var make_arrow = function(is, js, ie, je) {
	return {
		start : {i: is, j: js},
		end   : {i: ie, j: je},
		label : '',
		swap: false,
		type: 'rightarrow',
	}
}

var null_arrow = make_arrow(null, null, null, null)

var make_node = function(i, j, label) {
	if (typeof(label)==='undefined') label = '';
	return {
		i: i,
		j: j,
		label : label,
		arrows: [],
	}
}

var null_node = make_node(null, null)

var arrows_marker_start = {
	rightarrow: {normal: '', active: ''},
	dashrightarrow: {normal: '', active: ''},
	hookrightarrow: {normal: 'hook', active: 'hook-active'},
	twoheadrightarrow: {normal: '', active: ''},
}

var arrows_marker_end = {
	rightarrow: {normal: 'arrowhead', active: 'arrowhead-active'},
	dashrightarrow: {normal: 'arrowhead', active: 'arrowhead-active'},
	hookrightarrow: {normal: 'arrowhead', active: 'arrowhead-active'},
	twoheadrightarrow: {normal: 'twoarrowhead', active: 'twoarrowhead-active'},
}

var arrow_source = function(ar) {
	//console.log(ar.start.i, ar.start.j, ar.end.i, ar.end.j)
	var di = ar.end.i-ar.start.i
	if (di == 0) {
	 	diri = ''
	} else if (di > 0) {
		diri = 'd'.repeat(di)
	} else {
		diri = 'u'.repeat(-di)
	}
	var dj = ar.end.j-ar.start.j
	if (dj == 0) {
	 	dirj = ''
	} else if (dj > 0) {
		dirj = 'r'.repeat(dj)
	} else {
		dirj = 'l'.repeat(-dj)
	}
	var label = ar.label?'"'+ar.label+'"':''
	var swap = ar.swap?'swap':''
	var type = (ar.type == 'rightarrow')?'':ar.type
	var options = [label, diri+dirj, type, swap].filter(function(s){ return s != '' })
	//console.log(options)
	return ' \\ar['+options.join(', ')+']'
}

diagram = new Vue({
  el: '#tikzcd-edit',
  data: {
  	scale: 100,
    nodes: [[make_node(1, 1), make_node(1, 2)],
		        [make_node(2, 1), make_node(2, 2)]],
    active_node: null_node,
    active_arrow: null_arrow,
  },
  methods: {
	  conv: function(i) { return 50+(i-1)*this.scale },

		addCol: function() {
			var nb_rows = this.nodes.length
			var nb_cols = this.nodes[0].length
			for (i = 0; i < nb_rows; i++) {
				this.nodes[i].push(make_node(i+1, nb_cols+1))
			}
		},

		delCol: function() {
			var nb_rows = this.nodes.length
			for (i = 0; i < nb_rows; i++) {
				this.nodes[i].pop()
			}
		},

		addRow: function() {
			var new_nb_rows = this.nodes.length + 1
			var nb_cols = this.nodes[0].length
			var new_row = []
			for (i = 1; i <= nb_cols; i++) {
				new_row.push(make_node(new_nb_rows, i))
			}
			this.nodes.push(new_row)
		},

		delRow: function() {
			this.nodes.pop()
		},

		scaleUp: function() {
			this.scale += 20
		},

		scaleDown: function() {
			this.scale -= 20
		},

	  click_node: function(node, event) {
		  if (event.ctrlKey) {
			  var active = this.nodes[this.active_node.i-1][this.active_node.j-1]
				var arrow = make_arrow(active.i, active.j, node.i, node.j)
			  active.arrows.push(arrow)
		    this.active_node = null_node 
		    this.active_arrow = arrow
				var self = this
				Vue.nextTick(function () {
					if (self.$refs.arrowLabel) self.$refs.arrowLabel.focus();
        });
		  } else {
			  this.active_node = node
		    this.active_arrow = null_arrow
				var self = this
				Vue.nextTick(function () {
					if (self.$refs.nodeLabel) self.$refs.nodeLabel.focus();
        });
		  }
	  },

	  isNodeActive: function(node) {
		  return node.i == this.active_node.i && node.j == this.active_node.j
	  },

	  click_arrow: function(arrow, event) {
		  this.active_node = null_node
		  this.active_arrow = arrow
	  },

	  isArrowActive: function(arrow) {
		  return arrow == this.active_arrow
	  },

	  arrow_path: function(ar) {
		  var xs = this.conv(ar.start.j)
		  var ys = this.conv(ar.start.i)
		  var xe = this.conv(ar.end.j)
		  var ye = this.conv(ar.end.i)
			var l = Math.sqrt((xe-xs)*(xe-xs) + (ye-ys)*(ye-ys))
			var dx = 15*(xe-xs)/l
			var dy = 15*(ye-ys)/l
			//console.log(xs, ys, xe, ye)
			//console.log(dx, dy)
		  return "M"+(xs+dx)+", "+(ys+dy)+"L"+(xe-dx)+","+(ye-dy)
	  },
	  
	  arrow_dash: function(ar) {
		  return (ar.type == 'dashrightarrow')?'5,5':''
	  },
	  arrow_marker_start: function(ar) {
		if (this.isArrowActive(ar)) {
			return "url(#"+arrows_marker_start[ar.type].active+")"
		} else {
			return "url(#"+arrows_marker_start[ar.type].normal+")"
		}
	  },
	  arrow_marker_end: function(ar) {
		if (this.isArrowActive(ar)) {
			return "url(#"+arrows_marker_end[ar.type].active+")"
		} else {
			return "url(#"+arrows_marker_end[ar.type].normal+")"
		}
	  },

	  arrow_label_pos: function(ar) {
		  var xs = this.conv(ar.start.j)
		  var ys = this.conv(ar.start.i)
		  var xe = this.conv(ar.end.j)
		  var ye = this.conv(ar.end.i)
			var l = Math.sqrt((xe-xs)*(xe-xs) + (ye-ys)*(ye-ys))
			var nor = {x: (ye-ys)/l, y: (xs-xe)/l}
			return {
				x: xs + (xe-xs)/2 + (ar.swap?-10*nor.x:10*nor.x),
				y: ys + (ye-ys)/2 + (ar.swap?-10*nor.y:10*nor.y)
			}
	  },

	  delArrow: function(ar) {
		  var index = this.nodes[ar.start.i-1][ar.start.j-1].arrows.indexOf(ar)
		  this.nodes[ar.start.i-1][ar.start.j-1].arrows.splice(index,1)
		  this.active_arrow = null_arrow
	  },
  },

	computed: {
		width: function() {
			return this.nodes[0].length*this.scale + this.scale/2
		},
		height: function() {
			return this.nodes.length*this.scale
		},
		tikzsource: function() {
			var source = "\\begin{tikzcd}\n"
			this.nodes.forEach(function(row) {
				var row_source = []
			  row.forEach(function(node) {
					node_source = node.label 
					node.arrows.forEach(function(arrow) {
						node_source += arrow_source(arrow)
					})
					row_source.push(node_source)
				})
				source += '  ' + row_source.join(' & ') + ' \\\\\n'
			})
			source = source.slice(0, source.length-3)
			source += "\n\\end{tikzcd}"
			return source
		},
	}
})
