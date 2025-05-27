import bpy
from bpy.props import StringProperty, BoolProperty, EnumProperty
from bpy_extras.io_utils import ExportHelper, orientation_helper
import json
import bmesh

@orientation_helper(axis_forward='-Z', axis_up='Y')
class ExportJson(bpy.types.Operator, ExportHelper):
    """Export selected objects as a straight-forward JSON file."""

    bl_idname = "export.json"
    bl_label = "Export JSON"

    # ExportHelper mix-in class uses this.
    filename_ext = ".json"

    filter_glob: StringProperty(
        default="*.json",
        options={'HIDDEN'},
    )

    def execute(self, context):
        data = self._collect_export_data(context)
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(data, f)
        return {'FINISHED'}

    def _collect_export_data(self, context):
        result = {
            "pos": [],
            "norm": [],
        }

        for obj in context.selected_objects:
            mesh = _fetch_mesh(obj)

            for polygon in mesh.polygons.values():
                for idx in polygon.vertices:
                    vtx = mesh.vertices[idx]
                    result["pos"].extend(c for c in vtx.co)
                    result["norm"].extend(c for c in polygon.normal)
            obj.to_mesh_clear()

        return result


def _fetch_mesh(obj):
    mesh = obj.to_mesh()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return mesh
    


def menu_func_export(self, context):
    self.layout.operator(ExportJson.bl_idname, text="In-house JSON")


def register():
    bpy.utils.register_class(ExportJson)
    bpy.types.TOPBAR_MT_file_export.append(menu_func_export)


def unregister():
    bpy.utils.unregister_class(ExportJson)
    bpy.types.TOPBAR_MT_file_export.remove(menu_func_export)


if __name__ == "__main__":
#    unregister()
    register()
    bpy.ops.export.json('INVOKE_DEFAULT')
