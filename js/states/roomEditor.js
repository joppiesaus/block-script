//this file handles the scene/update/rendering of the script editor
roomEditor = {
	container: undefined,
	enabled: false,
	enable: function(){
		keyboard.enableState('roomEditor')
	},
	disable: function(){
		keyboard.disableState('roomEditor')
	},

	events: new Events(),
	scene: undefined,
	camera: undefined,
	loadedRoom: undefined,
	voxelMap: undefined,
	// tools
	tools: [],
	controls: undefined,
	voxelMapEditor: undefined,
	init: function(){
		//set up state
		this.container = $('#room-editor');

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 1, 20000 );
		this.camera.position.set(1000,1000,1000);

		this.controls = new THREE.OrbitControls(this.camera, this.container.get(0), renderer.domElement);
		this.controls.damping = 0.2;
		// this.tools.push({
		// 	id: 'pan',
		// 	object: this.controls
		// });

		this.voxelMapEditor = new SelectBlocks(this);
		this.tools.push({
			id: 'blocks',
			object: this.voxelMapEditor
		});
		
		this.setUpScene();

		this.voxelMap = new VoxelMap(this,{});

		$(window).resize(function(event) {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
		}.bind(this));

		this.events.once('load',function(){
			this.modal.tool('blocks');
		}.bind(this))
	},
	setUpScene: function(){
		light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 1, 1, 1 );
		this.scene.add( light );

		var ambient = new THREE.AmbientLight( 0x666666 );
	    this.scene.add(ambient);

		//small grid
		var grid = new THREE.GridHelper( game.blockSize * 20, game.blockSize );
		grid.setColors( 0x808080, 0x808080 );
		this.scene.add(grid);

		//big grid
		var grid = new THREE.GridHelper( game.chunkSize * game.blockSize * 2, game.chunkSize * game.blockSize );
		grid.setColors( 0x000000, 0x000000 );
		this.scene.add(grid);

		$.ajax({
			url: 'data/menuScene.json',
			type: 'GET',
			dataType: 'json'
		})
		.done(function(data){
			data.size = new THREE.Vector3().copy(data.size);
			data.offset = new THREE.Vector3().copy(data.offset);
			this.voxelMap.inportMapData(data);
		}.bind(this))
	},

	update: function(dtime){
		this.animate(dtime);
		this.render(dtime);
	},
	animate: function(dtime){
		for (var i = 0; i < this.tools.length; i++) {
			this.tools[i].object.update(dtime);
		};
	},
	render: function(dtime){
		renderer.setClearColor(0x2b3e50, 1);

		renderer.clear();
		renderer.render(this.scene, this.camera);
	},

	loadRoom: function(room){
		if(!room instanceof resources.getResourceType('room')){
			console.error('trying to open a non room resource');
			return;
		}

		//load it
		this.loadedRoom = room;
	},
	saveRoom: function(cb){
		if(this.loadedRoom){
			this.loadRoom.save(cb);
		}
		Messenger().success('Room Saved')
	},

	modal: {
		back: 'menu',
		tool: observable('none',function(val){
			var self = roomEditor;
			for (var i = 0; i < self.tools.length; i++) {
				if(self.tools[i].id == val){
					self.tools[i].object.enabled = true;
				}
				else{
					self.tools[i].object.enabled = false;
				}
			}
		}),
		toolbar: {
			goBack: function(){
				var self = roomEditor.modal;
				states.enableState(self.back());
			},
			file: {
				save: function(){
					roomEditor.saveRoom();
				}
			}
		}
	}
}

states.addState('roomEditor',roomEditor);

//create the keypress object
var lastTool;
roomEditor.keypress = keyboard.createState([
	{
		keys: 'meta s',
		prevent_default: true,
		on_keydown: function(){
			this.saveRoom();
		},
		this: roomEditor
	}
],'roomEditor');