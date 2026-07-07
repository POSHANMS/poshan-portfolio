module.paths.push('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules');

const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const draco3d = require('draco3d');
const path = require('path');

const glbPath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/models/laptop.glb');

async function main() {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
  
  const document = await io.read(glbPath);
  const root = document.getRoot();
  const meshes = root.listMeshes();

  const screenMesh = meshes.find(m => m.getName() === 'Object_7');
  if (!screenMesh) {
    console.error('Could not find Object_7 mesh!');
    return;
  }

  const prim = screenMesh.listPrimitives()[0];
  if (!prim) {
    console.error('Mesh has no primitives!');
    return;
  }

  console.log('List of attributes for Object_7:');
  const semantics = prim.listSemantics();
  for (const sem of semantics) {
    const acc = prim.getAttribute(sem);
    console.log(`  Semantics: "${sem}" -> Accessor Name: "${acc ? acc.getName() : 'none'}"`);
  }
}

main().catch(console.error);
