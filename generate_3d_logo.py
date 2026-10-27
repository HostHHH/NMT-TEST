# generate_3d_logo.py
# Ідеальна чиста 3D-модель iSторія для 3D-друку (чисті літери + чистий п'єдестал)
import bpy
import os
import math

def create_clean_logo():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    font_path = r"C:\Users\oresh\OneDrive\Desktop\[Folders]\dergat\shared\fonts\Mariupol-Bold.ttf"
    if not os.path.exists(font_path):
        raise FileNotFoundError(f"Шрифт не знайдено: {font_path}")
    font = bpy.data.fonts.load(font_path)

    # Матеріали (Золото, Титан/Срібло, Обсидіан)
    mat_gold = bpy.data.materials.new(name="Cossack_Gold")
    bsdf_gold = mat_gold.node_tree.nodes.get("Principled BSDF")
    if bsdf_gold:
        bsdf_gold.inputs["Base Color"].default_value = (0.95, 0.76, 0.28, 1.0)
        bsdf_gold.inputs["Metallic"].default_value = 0.88
        bsdf_gold.inputs["Roughness"].default_value = 0.22

    mat_silver = bpy.data.materials.new(name="Titanium_Silver")
    bsdf_silver = mat_silver.node_tree.nodes.get("Principled BSDF")
    if bsdf_silver:
        bsdf_silver.inputs["Base Color"].default_value = (0.92, 0.94, 0.97, 1.0)
        bsdf_silver.inputs["Metallic"].default_value = 0.35
        bsdf_silver.inputs["Roughness"].default_value = 0.25

    mat_dark = bpy.data.materials.new(name="Obsidian_Base")
    bsdf_dark = mat_dark.node_tree.nodes.get("Principled BSDF")
    if bsdf_dark:
        bsdf_dark.inputs["Base Color"].default_value = (0.07, 0.08, 0.10, 1.0)
        bsdf_dark.inputs["Metallic"].default_value = 0.15
        bsdf_dark.inputs["Roughness"].default_value = 0.45

    # 1. Підставка (Pedestal Base) — гладка, з красивою фаскою, без глючних написів
    # Розміри: Ширина 138 мм, Глибина 34 мм, Висота 8 мм
    base_w, base_d, base_h = 138.0, 34.0, 8.0
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, base_h / 2.0))
    pedestal = bpy.context.active_object
    pedestal.name = "Pedestal_Base"
    pedestal.scale = (base_w, base_d, base_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Акуратна фаска 2.2 мм
    mod_b = pedestal.modifiers.new(name="Bevel", type='BEVEL')
    mod_b.width = 2.2
    mod_b.segments = 4
    mod_b.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = pedestal
    bpy.ops.object.modifier_apply(modifier="Bevel")
    pedestal.data.materials.append(mat_dark)

    # Центрування літер iSторія
    center_offset_x = -60.62
    text_y = 0.0
    text_z = base_h - 1.0 # втоплюємо на 1 мм у підставку для монолітного з'єднання

    # 2. Текст 'iS' (Золотий)
    bpy.ops.object.text_add(location=(center_offset_x, text_y, text_z))
    text_is = bpy.context.active_object
    text_is.name = "Text_iS"
    text_is.data.font = font
    text_is.data.body = "iS"
    text_is.data.size = 38.0
    text_is.data.extrude = 6.0 # 12 мм глибина
    text_is.data.bevel_depth = 0.55
    text_is.data.bevel_resolution = 3
    text_is.rotation_euler = (math.radians(90), 0, 0)
    text_is.data.materials.append(mat_gold)
    bpy.context.view_layer.objects.active = text_is
    bpy.ops.object.convert(target='MESH')

    # 3. Текст 'торія' (Сріблястий/Титановий)
    toriya_start_x = center_offset_x + 33.33
    bpy.ops.object.text_add(location=(toriya_start_x, text_y, text_z))
    text_toriya = bpy.context.active_object
    text_toriya.name = "Text_Toriya"
    text_toriya.data.font = font
    text_toriya.data.body = "торія"
    text_toriya.data.size = 38.0
    text_toriya.data.extrude = 5.5 # 11 мм глибина
    text_toriya.data.bevel_depth = 0.5
    text_toriya.data.bevel_resolution = 3
    text_toriya.rotation_euler = (math.radians(90), 0, 0)
    text_toriya.data.materials.append(mat_silver)
    bpy.context.view_layer.objects.active = text_toriya
    bpy.ops.object.convert(target='MESH')

    # 4. Монолітні містки під крапки 'i' та 'і' (щоб надрукувалося без підтримок)
    bridge_w, bridge_d, bridge_h = 3.6, 9.5, 3.2
    
    # Місток під латинську 'i' в iS:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-55.9, text_y, base_h + 17.5))
    bridge1 = bpy.context.active_object
    bridge1.name = "Bridge_Dot_i"
    bridge1.scale = (bridge_w, bridge_d, bridge_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bridge1.data.materials.append(mat_gold)

    # Місток під українську 'і' в торія:
    dot2_x = toriya_start_x + 64.6
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(dot2_x, text_y, base_h + 17.5))
    bridge2 = bpy.context.active_object
    bridge2.name = "Bridge_Dot_ua_i"
    bridge2.scale = (bridge_w, bridge_d, bridge_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bridge2.data.materials.append(mat_silver)

    # Директорія для файлів
    out_dir = r"C:\Users\oresh\OneDrive\Desktop\[Folders]\dergat\3d_model"
    os.makedirs(out_dir, exist_ok=True)

    # Експорт кольорового GLB
    bpy.ops.object.select_all(action='SELECT')
    glb_path = os.path.join(out_dir, "iStoriya_Desk_Logo.glb")
    bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB')
    print("✅ Експортовано GLB:", glb_path)

    # Об'єднуємо все в єдиний ідеальний Solid Mesh без багів
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = pedestal
    bpy.ops.object.join()
    solid = bpy.context.active_object
    solid.name = "iStoriya_Desk_Logo_Clean"

    # Експорт STL
    stl_path = os.path.join(out_dir, "iStoriya_Desk_Logo_3D_Print.stl")
    bpy.ops.wm.stl_export(filepath=stl_path)
    print("✅ Експортовано STL для слайсера:", stl_path)

    # Експорт OBJ
    obj_path = os.path.join(out_dir, "iStoriya_Desk_Logo.obj")
    bpy.ops.wm.obj_export(filepath=obj_path)
    print("✅ Експортовано OBJ:", obj_path)

if __name__ == "__main__":
    create_clean_logo()
