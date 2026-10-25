/* =====================================================================
   ZICA CREATIVE QUEST — question bank (source of truth)
   ---------------------------------------------------------------------
   Set A = first attempt (25). Set B = "Try again" (25 different ones).
   Attempts alternate A → B → A → …

   Write the CORRECT answer first in `options`. The build script
   (tools/build-seed.mjs) moves it to a balanced A/B/C/D position so
   the right answer isn't always "A". Questions with `fixed: true`
   keep their order (options that name visual labels like "Palette B").

   After editing: node tools/build-seed.mjs   → updates supabase/schema.sql
   (Questions already in a live database are edited in the Google Sheet.)
   ===================================================================== */
export const QUESTIONS = [
  /* ============================ SET A ============================ */
  { id: 'A01', set: 'A', category: 'Software & Tools', type: 'tool', topic: '3D software', asset: 'svg:viewport',
    q: 'This is a 3D viewport. Which of these apps would you open to model the cube in it?',
    options: ['Blender', 'Photoshop', 'Premiere Pro', 'Microsoft Word'],
    why: 'Blender is a free, open-source 3D suite for modeling, animation and rendering. Photoshop edits 2D images, Premiere Pro edits video, and Word is for documents.',
    alt: 'A 3D viewport with a perspective grid floor, a wireframe cube slowly rotating and a small red-green-blue axis gizmo in the corner.' },

  { id: 'A02', set: 'A', category: 'Visual Recognition', type: 'image', topic: '2D vs 3D', asset: 'svg:dims', fixed: true,
    q: 'Look at shapes A and B. Which one is drawn as a 3D object?',
    options: ['Shape A', 'Shape B', 'Both are 3D', 'Neither is 3D'], correct: 1,
    why: 'A 3D object has width, height AND depth. Shape B shows three faces in three shades, so your eye reads depth. Shape A only has width and height — that is 2D.',
    alt: 'Shape A is a flat orange square. Shape B is a cube showing its top, front and side faces in three shades.' },

  { id: 'A03', set: 'A', category: 'Animation Principles', type: 'animation', topic: 'Squash & stretch', asset: 'svg:ball',
    q: 'Watch the bouncing ball. Which animation principle is it showing?',
    options: ['Squash and stretch', 'Anticipation', 'Staging', 'Follow through'],
    why: 'The ball flattens (squash) when it hits the ground and stretches as it speeds up. It makes objects feel soft, heavy and alive — it is the first of Disney\'s 12 classic principles of animation.',
    alt: 'A ball falls, flattens wide on impact, stretches tall as it bounces up, and repeats.' },

  { id: 'A04', set: 'A', category: 'Film Language', type: 'image', topic: 'Storyboards', asset: 'svg:board',
    q: 'Before filming or animating, artists plan with panels like these. What are they called?',
    options: ['A storyboard', 'A texture map', 'A colour palette', 'A render farm'],
    why: 'A storyboard is a comic-strip-style plan of a film, shot by shot. It lets the whole team agree on camera angles, action and timing before any expensive animation or filming starts.',
    alt: 'Three numbered sketch panels with arrows: a wide shot of a character near a house, a close-up of a smiling face, and the character running.' },

  { id: 'A05', set: 'A', category: 'Lighting', type: 'image', topic: 'Key light direction', asset: 'svg:light',
    q: 'Look at the brightest spot and the shadow. Where is the main light coming from?',
    options: ['From the upper left', 'From the right', 'From directly below', 'From behind the ball'],
    why: 'The side facing a light gets the brightest highlight, and the shadow falls on the opposite side. Lighting artists call this main light the key light — reading it is one of the first lighting skills you learn.',
    alt: 'A sphere that is brightest on its upper-left side and darker on the lower right, with a shadow stretching to the lower right.' },

  { id: 'A06', set: 'A', category: 'Animation Principles', type: 'animation', topic: 'Keyframes', asset: 'svg:keys',
    q: 'An animator sets the ball\'s position only at frame 1 and frame 24, and the software fills in the rest. What are frames 1 and 24 called?',
    options: ['Keyframes', 'Layers', 'Renders', 'Storyboards'],
    why: 'Keyframes mark the important poses or positions. The frames between them are in-betweens — the software (or an in-between artist in 2D) creates them.',
    alt: 'A ball slides from left to right. Below it, a timeline from frame 1 to 24 has diamond markers on frames 1 and 24 and a moving playhead.' },

  { id: 'A07', set: 'A', category: 'Creative Puzzle', type: 'puzzle', topic: 'Figure & negative space', asset: 'svg:vase',
    q: 'Look closely at this image. What do you see?',
    options: ['Both — a vase and two faces', 'Only a vase', 'Only two faces', 'Just random shapes'],
    why: 'This is Rubin\'s vase. The light shape and the dark shapes both make sense, so your brain flips between a vase and two faces. Designers use this negative space to hide a second picture inside the first.',
    alt: 'A light vase shape in the centre whose two edges also form the dark profiles of two faces looking at each other.' },

  { id: 'A08', set: 'A', category: 'VFX & Compositing', type: 'scenario', topic: 'Compositing', asset: 'svg:layers',
    q: 'An actor is filmed in front of a green screen, then placed inside a CGI castle. What is combining these layers into one shot called?',
    options: ['Compositing', 'Rigging', 'Sculpting', 'UV unwrapping'],
    why: 'Compositing combines separate elements — live footage, CGI, effects and backgrounds — into one final image. Removing the green background first is called chroma keying.',
    alt: 'Green-screen footage of an actor, plus a CGI castle background, equals a final shot with the actor standing in front of the castle.' },

  { id: 'A09', set: 'A', category: 'Animation Principles', type: 'animation', topic: 'Anticipation', asset: 'svg:jump',
    q: 'The character crouches down before leaping up. What is this small "get ready" move called?',
    options: ['Anticipation', 'Follow through', 'Staging', 'Arcs'],
    why: 'Anticipation prepares the audience for an action — a crouch before a jump, a wind-up before a throw. Without it, movement feels sudden and weightless.',
    alt: 'A rounded character crouches down, springs up into the air and lands, on a loop.' },

  { id: 'A10', set: 'A', category: '3D Basics', type: 'image', topic: 'Rigging', asset: 'svg:rig',
    q: 'The lines and dots inside this character are bones and joints that let animators pose it. What is this setup called?',
    options: ['A rig', 'A texture', 'A render', 'A storyboard'],
    why: 'Rigging builds a digital skeleton with controls inside a 3D model. Animators move the rig — not every single polygon — to create poses.',
    alt: 'A character outline with a skeleton of bones and joint dots inside; one arm slowly waves.' },

  { id: 'A11', set: 'A', category: 'Drawing & Perspective', type: 'image', topic: 'Vanishing point', asset: 'svg:vp',
    q: 'The edges of the road seem to meet at one point on the horizon. What is that point called?',
    options: ['The vanishing point', 'The pivot point', 'The highlight', 'The centre of mass'],
    why: 'Parallel lines moving away from us appear to meet at a vanishing point on the horizon. Artists use it to draw roads, buildings and rooms with convincing depth — this is linear perspective.',
    alt: 'A road stretching to the horizon, its edges converging to one glowing point, with poles getting smaller into the distance.' },

  { id: 'A12', set: 'A', category: '3D Basics', type: 'image', topic: 'Materials & shaders', asset: 'svg:mats',
    q: 'Same shape, three different looks. To make a 3D ball look like shiny metal instead of rubber, what does an artist change?',
    options: ['Its material (shader)', 'Its number of keyframes', 'The frame rate', 'The camera position'],
    why: 'A material, also called a shader, tells the renderer how a surface reacts to light — how shiny, rough, metallic or transparent it is. The shape stays the same; only the surface changes.',
    alt: 'Three identical spheres labelled rubber, plastic and metal: soft and matte, glossy with a small highlight, and mirror-like with sharp reflections.' },

  { id: 'A13', set: 'A', category: 'Gaming', type: 'tool', topic: 'Game engines', asset: 'svg:engine',
    q: 'Unreal Engine and Unity draw scenes like this one 60 times every second. What are they mainly used to create?',
    options: ['Video games and real-time 3D', 'Printed posters and brochures', 'Music and podcasts', 'Spreadsheets and reports'],
    why: 'Unreal Engine and Unity are game engines: they draw 3D worlds in real time so players can interact with them. Today they are also used for films, virtual production and architecture.',
    alt: 'A game scene with a small character on floating platforms, a play button and a 60 FPS counter.' },

  { id: 'A14', set: 'A', category: 'Colour', type: 'puzzle', topic: 'Warm & cool colour', asset: 'svg:palettes', fixed: true,
    q: 'Which colour palette would make a scene feel warm, like a sunset?',
    options: ['Palette A', 'Palette B', 'Palette C', 'Palette D'], correct: 1,
    why: 'Reds, oranges and yellows are warm colours — they suggest heat, sunlight and energy. Blues and greens feel cool and calm. Colour artists pick a palette to set the mood before anything moves.',
    alt: 'Four palettes: A is blues and teals, B is reds, oranges and yellows, C is greys, D is greens and teals.' },

  { id: 'A15', set: 'A', category: 'Film Language', type: 'image', topic: 'Camera shots', asset: 'svg:shot',
    q: 'In this shot, the character\'s face fills almost the whole frame. What type of shot is it?',
    options: ['A close-up', 'A wide shot', 'An aerial shot', 'An over-the-shoulder shot'],
    why: 'A close-up shows emotion and detail — perfect for a reaction. A wide shot shows the whole setting, an aerial shot looks down from above, and an over-the-shoulder shot frames a conversation.',
    alt: 'A camera viewfinder with recording marks, filled almost completely by a character\'s surprised face.' },

  { id: 'A16', set: 'A', category: 'Composition', type: 'image', topic: 'Rule of thirds', asset: 'svg:thirds',
    q: 'The frame is split into a 3 × 3 grid and the subject sits where two lines cross. What is this guideline called?',
    options: ['The rule of thirds', 'Symmetry', 'Centre framing', 'The 180-degree rule'],
    why: 'The rule of thirds places important things on the grid lines or where they cross. It usually feels more natural and interesting than putting everything dead centre — photographers, animators and UI designers all use it.',
    alt: 'A landscape at dusk with a 3 by 3 grid over it; a lone tree and the sun sit on the grid\'s crossing points.' },

  { id: 'A17', set: 'A', category: 'Animation Basics', type: 'animation', topic: 'Frame rate', asset: 'svg:fps',
    q: 'Cinema films are traditionally shot at how many frames per second?',
    options: ['24', '5', '100', '1,000'],
    why: 'Most films run at 24 frames per second — fast enough for your eye to see smooth motion. Games often aim for 60, and a lot of 2D animation is drawn "on twos": 12 new drawings each second.',
    alt: 'A flipbook flicking through pages of a running figure while a counter ticks from 1 to 24 frames, equal to one second.' },

  { id: 'A18', set: 'A', category: 'Colour', type: 'image', topic: 'Complementary colours', asset: 'svg:wheel',
    q: 'Colours that sit opposite each other on the colour wheel — like blue and orange — are called…',
    options: ['Complementary colours', 'Analogous colours', 'Monochrome colours', 'Pastel colours'],
    why: 'Complementary colours sit directly opposite on the wheel, so they make each other pop. That is why so many movie posters use orange and teal. Analogous colours are neighbours on the wheel.',
    alt: 'A twelve-segment colour wheel with the blue and orange segments highlighted and joined by an arrow across the centre.' },

  { id: 'A19', set: 'A', category: 'Character Design', type: 'image', topic: 'Silhouette test', asset: 'svg:silhouette',
    q: 'Character artists fill a pose with solid black to check that it still reads clearly. What is this check called?',
    options: ['A silhouette test', 'A colour test', 'A render test', 'A lighting test'],
    why: 'If a pose or character design is recognisable as a pure black shape, it will read instantly on screen. Great game and cartoon characters all pass the silhouette test.',
    alt: 'A character striking a dynamic pose, which fills in to a solid black silhouette and back again.' },

  { id: 'A20', set: 'A', category: 'Animation Principles', type: 'animation', topic: 'Slow in & slow out', asset: 'svg:ease',
    q: 'The ball\'s positions are bunched up at the start and end of the move, and spread out in the middle. Which principle is this?',
    options: ['Slow in and slow out', 'Squash and stretch', 'Staging', 'Exaggeration'],
    why: 'Real objects speed up and slow down gradually. Putting more drawings near the start and end of a move (and fewer in the middle) makes it ease in and ease out, instead of moving like a robot.',
    alt: 'A ball glides between two points, speeding up in the middle; tick marks under its path are close together at both ends and wide apart in the middle.' },

  { id: 'A21', set: 'A', category: 'Animation Principles', type: 'animation', topic: 'Arcs', asset: 'svg:arcs',
    q: 'A thrown ball follows a curved path, and so do swinging arms and turning heads. Which animation principle is this?',
    options: ['Arcs', 'Timing', 'Solid drawing', 'Appeal'],
    why: 'Almost every natural movement travels along an arc. Animators trace these curves to check their motion — straight-line movement looks mechanical.',
    alt: 'A ball is thrown and travels along a dotted curved path, leaving fading copies of itself along the arc.' },

  { id: 'A22', set: 'A', category: 'Camera & Lens', type: 'image', topic: 'Depth of field', asset: 'svg:dof',
    q: 'Only the middle object is sharp — the ones in front and behind are blurry. What is this camera effect called?',
    options: ['Shallow depth of field', 'Motion blur', 'Lens flare', 'Vignette'],
    why: 'Depth of field is how much of the scene is in focus. A shallow depth of field keeps only one distance sharp, guiding the viewer\'s eye. 3D renders fake it to look like a real camera.',
    alt: 'Three spheres at different distances; only the middle one is in sharp focus while the near and far ones are blurred, with a focus bracket on the middle one.' },

  { id: 'A23', set: 'A', category: '3D Basics', type: 'image', topic: 'Polygons', asset: 'svg:mesh',
    q: '3D models are built from many small flat faces, like the highlighted one. What are these faces called?',
    options: ['Polygons', 'Pixels', 'Vectors', 'Keyframes'],
    why: 'A 3D mesh is made of polygons — flat faces joined at edges and points called vertices. More polygons mean more detail but heavier files, so game artists balance the count carefully.',
    alt: 'A low-poly sphere drawn as a wireframe mesh with vertex dots; one face blinks highlighted in orange.' },

  { id: 'A24', set: 'A', category: '3D Basics', type: 'animation', topic: 'UV unwrapping', asset: 'svg:uv',
    q: 'Flattening a 3D model\'s surface into a 2D layout, so a texture can be painted on it, is called…',
    options: ['UV unwrapping', 'Rigging', 'Rendering', 'Keyframing'],
    why: 'UV unwrapping is like unfolding a cardboard box flat. Texture artists paint on the flat layout, and the software wraps the painting back around the 3D model.',
    alt: 'A dice-patterned cube unfolds into a flat cross-shaped layout of six squares, then folds back up.' },

  { id: 'A25', set: 'A', category: 'Graphic Design', type: 'image', topic: 'Vector vs pixel', asset: 'svg:vector',
    q: 'Zoomed in, circle A turns blocky but circle B stays perfectly smooth. What kind of image is B?',
    options: ['A vector graphic', 'A pixel (raster) image', 'A photograph', 'A low-resolution GIF'],
    why: 'Vector graphics are stored as maths — points and curves — so they stay crisp at any size. That is why logos are designed in vector apps like Illustrator. Pixel images are grids of coloured squares.',
    alt: 'Two magnified circle edges: A is a staircase of square pixels, B is a smooth curve with anchor points and handles.' },

  /* ============================ SET B ============================ */
  { id: 'B01', set: 'B', category: 'Animation Principles', type: 'animation', topic: 'Follow through', asset: 'svg:follow',
    q: 'The character stops suddenly, but its antenna keeps swinging for a moment. Which animation principle is this?',
    options: ['Follow through', 'Anticipation', 'Staging', 'Solid drawing'],
    why: 'Loose parts — hair, tails, clothes, antennae — keep moving after the body stops, then settle. Follow through (and its partner, overlapping action) makes animation feel physical.',
    alt: 'A small round robot slides in and stops; its springy antenna keeps wobbling back and forth before it settles.' },

  { id: 'B02', set: 'B', category: 'Animation Principles', type: 'animation', topic: 'Timing', asset: 'svg:timing',
    q: 'Both balls travel the same distance, but ball B uses more frames, so it moves slower and feels heavier. Which principle is this?',
    options: ['Timing', 'Staging', 'Appeal', 'Arcs'],
    why: 'Timing is the number of frames an action takes. Fewer frames feel fast and light; more frames feel slow and heavy. Changing only the timing can turn a ping-pong ball into a bowling ball.',
    alt: 'Two lanes: ball A crosses quickly with four frame marks; ball B crosses slowly with twelve frame marks.' },

  { id: 'B03', set: 'B', category: 'Animation Principles', type: 'image', topic: 'Exaggeration', asset: 'svg:exagg',
    q: 'Face B pushes the surprise far beyond real life — huge eyes, dropped jaw. Which principle is this?',
    options: ['Exaggeration', 'Follow through', 'Staging', 'Timing'],
    why: 'Exaggeration pushes poses and expressions further than reality so emotions read instantly — even from the back of a cinema. It is a big part of what makes cartoons feel alive.',
    alt: 'Two faces side by side: A looks mildly surprised; B has enormous eyes, raised brows and a wide-open mouth.' },

  { id: 'B04', set: 'B', category: 'Animation Principles', type: 'image', topic: 'Staging', asset: 'svg:stage',
    q: 'Using light, position and camera so the audience knows exactly where to look is called…',
    options: ['Staging', 'Rendering', 'Rigging', 'Texturing'],
    why: 'Staging presents an idea so clearly it can\'t be missed — like a spotlight on the hero while everything else fades back. It comes from theatre and is one of the 12 principles of animation.',
    alt: 'A stage where a spotlight shines on one character while two others stand in shadow.' },

  { id: 'B05', set: 'B', category: 'Animation Basics', type: 'animation', topic: 'Walk cycle', asset: 'svg:walk',
    q: 'An animation that loops seamlessly, like these steps, is called a…',
    options: ['Walk cycle', 'Storyboard', 'Turnaround', 'Render pass'],
    why: 'A walk cycle is a set of poses where the last frame flows straight back into the first, so it can loop forever. It is one of the first exercises every animation student masters.',
    alt: 'A simple figure walks on the spot, legs and arms swinging in a loop, with a circular loop arrow beside it.' },

  { id: 'B06', set: 'B', category: 'Character Design', type: 'image', topic: 'Turnaround', asset: 'svg:turn',
    q: 'A sheet showing the same character from the front, side and back is called a…',
    options: ['Turnaround (model sheet)', 'Storyboard', 'Mood board', 'Sprite sheet'],
    why: 'A turnaround keeps a character consistent: 3D modelers build from it, and every animator draws the same proportions. Front, three-quarter, side and back views are standard.',
    alt: 'One character drawn four times in a row — front, three-quarter, side and back — with guide lines at head, waist and feet.' },

  { id: 'B07', set: 'B', category: 'Lighting', type: 'image', topic: 'Three-point lighting', asset: 'svg:threepoint',
    q: 'In three-point lighting there is a key light, a fill light and a third light behind the subject. What is it called?',
    options: ['Back light (rim light)', 'Ambient light', 'Sun light', 'Ring light'],
    why: 'The key light is the main light, the fill softens shadows, and the back (rim) light outlines the subject to separate it from the background. Film sets and 3D scenes use this setup every day.',
    alt: 'A top-down diagram: a subject in the centre, a camera at the bottom, a key light and fill light on either side, and a third light behind marked with a question mark.' },

  { id: 'B08', set: 'B', category: 'Lighting', type: 'image', topic: 'Colour temperature', asset: 'svg:temp',
    q: 'A candle gives warm orange light. Which light colour would make a scene feel like moonlight?',
    options: ['Cool blue', 'Warm orange', 'Bright yellow', 'Deep red'],
    why: 'Light has a colour temperature, measured in Kelvin. Candles and sunsets are warm (orange); moonlight and shade feel cool (blue). Lighting artists use this to tell the audience the time of day.',
    alt: 'A scene split in two: a candle-lit room glowing orange on the left, a moonlit window glowing blue on the right, above a warm-to-cool Kelvin scale.' },

  { id: 'B09', set: 'B', category: 'Film Language', type: 'image', topic: 'Low-angle shot', asset: 'svg:lowangle',
    q: 'The camera looks up at the hero, making them feel big and powerful. What kind of shot is this?',
    options: ['A low-angle shot', 'A high-angle shot', 'A bird\'s-eye view', 'A close-up'],
    why: 'A low-angle shot places the camera below the subject, so they tower over us — great for heroes and villains. A high-angle shot does the opposite and makes characters look small.',
    alt: 'A camera on the ground tilted upward at a tall hero standing against the sky, drawn in steep perspective.' },

  { id: 'B10', set: 'B', category: 'Film Language', type: 'image', topic: 'Establishing shot', asset: 'svg:establish',
    q: 'The wide opening shot that shows the audience where a scene takes place is called…',
    options: ['An establishing shot', 'A close-up', 'A cutaway', 'An insert shot'],
    why: 'An establishing shot sets up the location — a city skyline, a school, a spaceship — before the story moves in closer. It gives the audience their bearings.',
    alt: 'A wide view of a city skyline at dusk with a clapperboard reading Scene 1, Shot 1.' },

  { id: 'B11', set: 'B', category: 'VFX & Compositing', type: 'scenario', topic: 'Chroma key', asset: 'svg:greenscreen',
    q: 'Why are chroma-key screens usually bright green?',
    options: ['Green is very different from skin tones, so it\'s easy to remove', 'Green makes actors look better', 'Cameras can\'t record green', 'Green is the cheapest paint'],
    why: 'Keying software removes one colour. Bright green (or blue) is far away from human skin tones, so the computer can cut it out cleanly without eating into the actor. Digital cameras are also very sensitive to green.',
    alt: 'An actor in front of a green screen, with a colour wheel showing skin tones on one side and the green screen colour far away on the other.' },

  { id: 'B12', set: 'B', category: 'VFX & Compositing', type: 'animation', topic: 'Particles', asset: 'svg:particles',
    q: 'Fire, smoke, rain and sparks in VFX are often made from thousands of tiny moving points. What are they called?',
    options: ['Particles', 'Polygons', 'Keyframes', 'Layers'],
    why: 'A particle system emits huge numbers of tiny points, each with its own speed, life and colour. Together they behave like sparks, dust, rain or magic — software like Houdini and Blender is built for it.',
    alt: 'A glowing emitter shoots a fountain of spark particles that rise, drift and fade out.' },

  { id: 'B13', set: 'B', category: 'VFX & Compositing', type: 'image', topic: 'Rotoscoping', asset: 'svg:roto',
    q: 'Tracing an outline around something in live-action footage, frame by frame, is called…',
    options: ['Rotoscoping', 'Rigging', 'Rendering', 'Retopology'],
    why: 'Rotoscoping traces shapes in footage so they can be cut out or animated over. VFX artists roto actors to put effects behind them; classic films traced real actors to animate them.',
    alt: 'A video frame of a dancer, with a dashed orange outline of points being traced around her body, marked frame 042.' },

  { id: 'B14', set: 'B', category: 'VFX & Compositing', type: 'animation', topic: 'Motion tracking', asset: 'svg:track',
    q: 'These markers help software follow the camera\'s movement, so CGI stays glued to the shot. What is this called?',
    options: ['Motion tracking', 'Colour grading', 'Keying', 'Rendering'],
    why: 'Motion (camera) tracking follows points in the footage to rebuild how the real camera moved. A virtual camera then copies that movement, so the CGI moves perfectly with the live action.',
    alt: 'A street scene drifting slowly while small X markers stick to the ground and walls, each with a crosshair and a short motion trail.' },

  { id: 'B15', set: 'B', category: '3D Basics', type: 'animation', topic: 'Rendering', asset: 'svg:render',
    q: 'Turning a 3D scene into finished images is called…',
    options: ['Rendering', 'Modeling', 'Rigging', 'Storyboarding'],
    why: 'Rendering calculates light, shadows and materials to turn a 3D scene into final pixels. A single movie frame can take hours, which is why studios use render farms full of computers.',
    alt: 'A wireframe 3D shape being filled in by glowing render tiles, square by square, with a progress bar.' },

  { id: 'B16', set: 'B', category: '3D Basics', type: 'animation', topic: 'Extrude', asset: 'svg:extrude',
    q: 'Pulling a face of a model outward to add new geometry, like this, is called…',
    options: ['Extrude', 'Bevel', 'Mirror', 'Smooth'],
    why: 'Extrude pushes or pulls a face to create new geometry attached to the old — the most used tool in 3D modeling. A whole building can start as one cube extruded again and again.',
    alt: 'A cube whose top face is pulled upward by an arrow handle, growing a taller block, then sinking back.' },

  { id: 'B17', set: 'B', category: 'Gaming', type: 'image', topic: 'Isometric view', asset: 'svg:iso',
    q: 'This angled view, popular in strategy and city-building games, is called…',
    options: ['Isometric view', 'Side-scrolling view', 'First-person view', 'Fish-eye view'],
    why: 'Isometric view shows the world from a fixed angle above, with no vanishing points, so the whole map is easy to read. Many classic strategy and farming games use it.',
    alt: 'A small diamond-shaped island of tiles with a house, trees and a path, drawn at an angle from above.' },

  { id: 'B18', set: 'B', category: 'Gaming', type: 'image', topic: 'HUD', asset: 'svg:hud',
    q: 'The health bar, mini-map and score drawn on top of a game screen are called the…',
    options: ['HUD', 'Level', 'Skybox', 'Texture'],
    why: 'The HUD (heads-up display) shows the player key info without pausing the game. UI/UX designers in game studios design it so it\'s readable in a split second.',
    alt: 'A game screen with hearts and a health bar at the top left, a mini-map at the top right and a score at the bottom.' },

  { id: 'B19', set: 'B', category: 'Gaming', type: 'animation', topic: 'Hitboxes', asset: 'svg:hitbox',
    q: 'Games use invisible boxes like these to detect when something hits a character. What are they called?',
    options: ['Hitboxes', 'Skyboxes', 'Lightmaps', 'Text boxes'],
    why: 'Hitboxes are simple invisible shapes the game checks for collisions — far faster than checking every pixel of a character. Fighting games tune them frame by frame.',
    alt: 'A pixel-art character outlined by dashed boxes; a fireball flies in and the box flashes when it touches.' },

  { id: 'B20', set: 'B', category: 'Gaming', type: 'animation', topic: 'Sprite sheet', asset: 'svg:sprites',
    q: 'A grid of frames like this, used to animate a 2D game character, is called a…',
    options: ['Sprite sheet', 'Storyboard', 'Colour palette', 'Turnaround'],
    why: 'A sprite sheet packs every frame of a 2D character\'s animation into one image. The game shows one cell at a time, very fast, so the character appears to move.',
    alt: 'A grid of six pixel-art frames of a running character, with a highlight jumping from frame to frame while a preview runs beside it.' },

  { id: 'B21', set: 'B', category: 'Typography', type: 'image', topic: 'Serifs', asset: 'svg:serif',
    q: 'The small "feet" at the ends of the strokes on this letter are called…',
    options: ['Serifs', 'Kerning', 'Ligatures', 'Pixels'],
    why: 'Serifs are the small strokes at the ends of letters. Serif fonts (like Times) feel classic and bookish; sans-serif fonts (like the one you\'re reading now) feel clean and modern.',
    alt: 'A large letter T with its small feet and top end strokes highlighted in orange, next to a plain T without them.' },

  { id: 'B22', set: 'B', category: 'Typography', type: 'animation', topic: 'Kerning', asset: 'svg:kerning',
    q: 'Adjusting the space between two specific letters, like this A and V, is called…',
    options: ['Kerning', 'Leading', 'Highlighting', 'Justifying'],
    why: 'Kerning fixes awkward gaps between particular letter pairs, like A and V. Leading is the space between lines. Logo and UI designers kern by eye until the word looks evenly spaced.',
    alt: 'The letters A and V sit too far apart, then slide closer together until the gap looks even, with a spacing marker between them.' },

  { id: 'B23', set: 'B', category: 'Creative Puzzle', type: 'puzzle', topic: 'Illusory contours', asset: 'svg:kanizsa',
    q: 'Look at the bright triangle in the middle. Is it actually drawn?',
    options: ['No — your brain fills in the edges', 'Yes, with thin white lines', 'Yes, it\'s painted a lighter colour', 'It\'s a shadow'],
    why: 'This is the Kanizsa triangle. Only three "Pac-Man" shapes and three corners are drawn — your brain invents the missing edges. Designers use this "closure" effect to make logos with fewer lines.',
    alt: 'Three dark circles each with a wedge cut out, and three angled lines, arranged so a bright triangle seems to float in the middle.' },

  { id: 'B24', set: 'B', category: 'Creative Puzzle', type: 'puzzle', topic: 'Visual sequence', asset: 'svg:sequence', fixed: true,
    q: 'Each frame turns the arrow a quarter turn clockwise. Which way will it point in frame 4?',
    options: ['Up', 'Right', 'Down', 'Left'], correct: 3,
    why: 'Up → right → down → left: each frame is a 90° clockwise turn. Spotting patterns frame to frame is exactly how animators check the flow of a sequence.',
    alt: 'A film strip with three frames showing an arrow pointing up, then right, then down, and a fourth frame with a question mark.' },

  { id: 'B25', set: 'B', category: 'Software & Tools', type: 'scenario', topic: 'Video editing', asset: 'svg:timeline',
    q: 'You want to join 20 video clips into one short film with music. What kind of software do you need?',
    options: ['A video editor, like Premiere Pro or DaVinci Resolve', 'A 3D sculpting app', 'A spreadsheet', 'A font editor'],
    why: 'Video editors arrange clips on a timeline with tracks for video, music and sound, then export one film. Premiere Pro, DaVinci Resolve and Final Cut are industry favourites.',
    alt: 'An editing timeline with video tracks of coloured clips, an audio waveform track and a moving playhead.' }
];
