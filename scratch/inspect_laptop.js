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

  console.log('\n--- Bounding Boxes and Scores ---');
  const candidates = [];

  for (const mesh of meshes) {
    const prims = mesh.listPrimitives();
    if (prims.length === 0) continue;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const prim of prims) {
      const positionAccessor = prim.getAttribute('POSITION');
      if (positionAccessor) {
        const arr = positionAccessor.getArray();
        if (arr) {
          for (let i = 0; i < arr.length; i += 3) {
            const x = arr[i];
            const y = arr[i + 1];
            const z = arr[i + 2];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
          }
        }
      }
    }

    if (minX === Infinity) continue;

    const size = {
      x: maxX - minX,
      y: maxY - minY,
      z: maxZ - minZ
    };

    const center = {
      x: (maxX + minX) / 2,
      y: (maxY + minY) / 2,
      z: (maxZ + minZ) / 2
    };

    const flatness = size.z / Math.max(size.x, size.y, 0.0001);
    const score = size.x * size.y * 1.4 - size.z * 8 + center.y * 2.5 - flatness * 12;

    const satisfiesCondition = center.y > 0.15 && size.x > 0.2 && size.y > 0.12;

    console.log(`\nMesh: "${mesh.getName()}"`);
    console.log(`  Size: x=${size.x.toFixed(4)}, y=${size.y.toFixed(4)}, z=${size.z.toFixed(4)}`);
    console.log(`  Center: x=${center.x.toFixed(4)}, y=${center.y.toFixed(4)}, z=${center.z.toFixed(4)}`);
    console.log(`  Flatness: ${flatness.toFixed(4)}, Score: ${score.toFixed(4)}`);
    console.log(`  Satisfies Condition: ${satisfiesCondition}`);

    const materialName = prims[0].getMaterial() ? prims[0].getMaterial().getName() : 'none';
    const hasBaseColorTexture = prims[0].getMaterial() && !!prims[0].getMaterial().getBaseColorTexture();

    if (satisfiesCondition) {
      candidates.push({
        name: mesh.getName(),
        score: score,
        material: materialName,
        hasTexture: hasBaseColorTexture,
        aspectRatio: size.x / size.y,
        sizeX: size.x,
        sizeY: size.y
      });
    }
  }

  console.log('\n--- Screen Mesh Candidates (Sorted by Score) ---');
  candidates.sort((a, b) => b.score - a.score);
  for (const c of candidates) {
    console.log(`Candidate Mesh: "${c.name}"`);
    console.log(`  Score: ${c.score.toFixed(4)}`);
    console.log(`  Material: "${c.material}"`);
    console.log(`  Has BaseColorTexture: ${c.hasTexture}`);
    console.log(`  Dimensions: ${c.sizeX.toFixed(4)} x ${c.sizeY.toFixed(4)}`);
    console.log(`  Aspect Ratio (Width/Height): ${c.aspectRatio.toFixed(4)}`);
  }
}

main().catch(console.error);
