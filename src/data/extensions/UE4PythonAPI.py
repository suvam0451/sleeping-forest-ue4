import unreal

asset_path = "/Game/Materials/"
matref = unreal.AssetToolsHelpers.get_asset_tools().create_asset("M_Test", asset_path, unreal.Material, unreal.MaterialFactoryNew())
customNode01.set_editor_property("material_domain", "MD_SURFACE")

# Attach custom expression node
customNode01 = unreal.MaterialEditingLibrary.create_material_expression(matref, unreal.MaterialExpressionCustom, -400, 0)

unreal.MaterialEditingLibrary.connect_material_expressions(from_expression, from_output_name, to_expression, to_input_name)

customNode01.set_editor_property("description", "SampleText")
customNode01.set_editor_property("desc", "Critically important information")
customNode01.set_editor_property("output_type", unreal.CustomMaterialOutputType.CMOT_FLOAT1)

# List of pins to attach
inputpin01 = unreal.CustomInput()
inputpin01.set_editor_property("input_name", "UV")
inputpin02 = unreal.CustomInput()
inputpin02.set_editor_property("input_name", "BlurVal")
inputpin03 = unreal.CustomInput()
inputpin03.set_editor_property("input_name", "No")
inputpin04 = unreal.CustomInput()
inputpin04.set_editor_property("input_name", "Distortion")

# Inserting pins to custom expression
customNode01.set_editor_property("inputs", [inputpin01, inputpin02, inputpin03, inputpin04])
