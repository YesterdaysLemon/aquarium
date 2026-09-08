"""Run in Blender (including via MCP) after node scripts/export-fish-sources.mjs.
Creates an isolated scene, exports fish GLBs and renders true model portraits.
Never clears or saves over the user's existing scene/file.
"""
import bpy, bmesh, json, math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/living-fish'
DEST.mkdir(parents=True, exist_ok=True)
sources = json.loads((ROOT / 'output/models/fish-sources.json').read_text())
scene = bpy.data.scenes.new('Ocean Slice - Living Fish Studio')
bpy.context.window.scene = scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 256
scene.render.resolution_y = 160
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
world = bpy.data.worlds.new('Ocean Slice soft studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.24, .32, .40, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .65
scene.world = world

mat = bpy.data.materials.new('Ocean Slice - pearl scales and fin rays')
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value = .36
bsdf.inputs['Metallic'].default_value = .12
bsdf.inputs['Coat Weight'].default_value = .38
attribute = mat.node_tree.nodes.new('ShaderNodeVertexColor')
attribute.layer_name = 'Color'
mat.node_tree.links.new(attribute.outputs['Color'], bsdf.inputs['Base Color'])

objects = []
for source in sources:
    coords, colors = source['positions'], source['colors']
    verts = [(coords[i], -coords[i+2], coords[i+1]) for i in range(0, len(coords), 3)]
    faces = [(i, i+1, i+2) for i in range(0, len(verts), 3)]
    mesh = bpy.data.meshes.new(source['id'] + ' finished surfaces')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    attr = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    animation_uv = mesh.uv_layers.new(name='Anatomy')
    for polygon in mesh.polygons:
        polygon.use_smooth = True
        for loop_id in polygon.loop_indices:
            vi = mesh.loops[loop_id].vertex_index * 3
            attr.data[loop_id].color = (*colors[vi:vi+3], 1)
            ti = mesh.loops[loop_id].vertex_index * 2
            animation_uv.data[loop_id].uv = (source['animationUV'][ti], 1 - source['animationUV'][ti+1])
    # Weld exported triangle soup and recalculate consistent surface normals.
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.00001)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new('Ocean Slice ' + source['id'], mesh)
    scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj['species'] = source['id']
    obj['authoring'] = 'Original Ocean Slice parametric anatomy, finished in Blender'
    objects.append(obj)

camera_data = bpy.data.cameras.new('Ocean Slice portrait camera')
camera = bpy.data.objects.new('Ocean Slice portrait camera', camera_data)
scene.collection.objects.link(camera)
camera.location = (3.5, -0.18, .40)
camera.rotation_euler = (Vector((0, .14, .07)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 1.9
scene.camera = camera
for name, loc, power, size, color in [
    ('key', (2, -2, 4), 250, 4, (1, .92, .77)),
    ('fill', (3, 3, 1), 120, 3, (.70, .88, 1)),
    ('rim', (-2, 0, 3), 200, 2, (.75, 1, .94)),
]:
    light = bpy.data.lights.new('Ocean Slice ' + name, 'AREA')
    light.energy, light.shape, light.size, light.color = power, 'DISK', size, color
    obj = bpy.data.objects.new(light.name, light)
    scene.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (-obj.location).to_track_quat('-Z', 'Y').to_euler()

def export_models():
    for obj in objects:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        name = obj['species']
        bpy.ops.export_scene.gltf(filepath=str(DEST / (name + '.glb')), export_format='GLB',
            use_selection=True, use_active_scene=True, export_yup=True, export_animations=False, export_extras=True)
    print('EXPORTED', len(objects), 'Blender-finished GLB fish to', DEST)

def render_portraits():
    for obj in objects:
        obj.location = (0, 0, 0)
    for obj in objects:
        for other in objects:
            other.hide_render = other != obj
        height = max(v.co.z for v in obj.data.vertices) - min(v.co.z for v in obj.data.vertices)
        length = max(v.co.y for v in obj.data.vertices) - min(v.co.y for v in obj.data.vertices)
        center_y = (max(v.co.y for v in obj.data.vertices) + min(v.co.y for v in obj.data.vertices)) * .5
        center_z = (max(v.co.z for v in obj.data.vertices) + min(v.co.z for v in obj.data.vertices)) * .5
        camera_data.ortho_scale = max(1.7, length * 1.2, height * 1.6 * 1.2)
        camera.location = (3.5, center_y - .18, center_z + .25)
        camera.rotation_euler = (Vector((0, center_y, center_z)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(DEST / (obj['species'] + '.png'))
        bpy.ops.render.render(write_still=True)
    for index, obj in enumerate(objects):
        obj.hide_render = False
        obj.location = (0, (index % 5) * 2.1, (index // 5) * 2.0)
    bpy.data.libraries.write(str(ROOT / 'docs/living-fish-studio.blend'), {scene}, fake_user=True, compress=True)
    print('PORTRAITS_AND_STUDIO_SAVED')

export_models()
render_portraits()
