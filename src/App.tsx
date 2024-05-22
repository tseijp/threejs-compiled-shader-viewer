import * as React from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Highlight } from "prism-react-renderer";

const GLSLHighlight = ({ code = "" }) => {
  return (
    <Html
      zIndexRange={[0, 1]}
      fullscreen
      style={{ width: "100vw", height: "100vh", overflow: "scroll" }}
    >
      <Highlight code={code} language="cpp">
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </Html>
  );
};

const useAfterCompileShader = () => {
  const shader = useThree((state) => {
    const { gl, scene, camera } = state;
    const ctx = state.gl.getContext();

    const ret = {};

    gl.compile(scene, camera);
    gl.info.programs.forEach((pg) => {
      if (pg.fragmentShader)
        ret.fragmentShader = ctx.getShaderSource(pg.fragmentShader);
      if (pg.vertexShader)
        ret.vertexShader = ctx.getShaderSource(pg.vertexShader);
    });

    return ret;
  });
  return shader;
};

const AfterCompileShader = ({ isFrag }) => {
  const shader = useAfterCompileShader();
  return (
    <GLSLHighlight
      code={isFrag ? shader?.fragmentShader : shader?.vertexShader}
    />
  );
};

const BeforeCompileShader = ({ isFrag, shader }) => {
  return (
    <GLSLHighlight
      code={isFrag ? shader?.fragmentShader : shader?.vertexShader}
    />
  );
};

const withComment = (line = "") => {
  const decoration = "*".repeat(line.length + 8);
  return `
/**${decoration}
 *    ${line}    *
 **${decoration}/

${line}
`;
};

const App = () => {
  const [shader, setShader] = React.useState();
  const [before, setBefore] = React.useState(true);
  const [isFrag, setIsFrag] = React.useState(true);

  const onBeforeCompile = (shader) => {
    setShader({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
    });

    const replaceVertex = (...args) => {
      shader.vertexShader = shader.vertexShader.replace(...args);
    };

    const replaceFragment = (...args) => {
      shader.fragmentShader = shader.fragmentShader.replace(...args);
    };

    shader.fragmentShader.split("\n").forEach((line) => {
      if (line.includes("#include")) replaceFragment(line, withComment(line));
    });

    shader.vertexShader.split("\n").forEach((line) => {
      if (line.includes("#include")) replaceVertex(line, withComment(line));
    });
  };

  const handleChange = (e) => {
    const [_before, _isFrag] = e.target.value;
    setBefore(_before === "1");
    setIsFrag(_isFrag === "1");
  };

  return (
    <Canvas camera={{ position: [1, 1, 1] }}>
      <ambientLight />
      <pointLight />
      {before ? (
        <BeforeCompileShader isFrag={isFrag} shader={shader} />
      ) : (
        <AfterCompileShader isFrag={isFrag} />
      )}
      <mesh>
        <boxGeometry />
        <meshPhysicalMaterial color="red" onBeforeCompile={onBeforeCompile} />
      </mesh>
      <Html
        zIndexRange={[1, 2]}
        center
        style={{ width: "100vw", height: "100vh", pointerEvents: "none" }}
      >
        <select onChange={handleChange}>
          <option value="11">Before Compile Fragment Shader</option>
          <option value="10">Before Compile Vertex Shader</option>
          <option value="01">After Compiled Fragment Shader</option>
          <option value="00">After Compiled Vertex Shader</option>
        </select>
      </Html>
    </Canvas>
  );
};

export default App;