"use client"

import { type ComponentProps, useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type RealisticFogBackgroundProps = Omit<ComponentProps<"canvas">, "ref"> & {
  /** Controls how quickly the fog evolves without changing its density. */
  speed?: number
}

const vertexShaderSource = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragmentShaderSource = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  float hash(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float noise(vec2 point) {
    vec2 integer = floor(point);
    vec2 fraction = fract(point);
    float a = hash(integer);
    float b = hash(integer + vec2(1.0, 0.0));
    float c = hash(integer + vec2(0.0, 1.0));
    float d = hash(integer + vec2(1.0, 1.0));
    vec2 curve = fraction * fraction * (3.0 - 2.0 * fraction);

    return mix(a, b, curve.x)
      + (c - a) * curve.y * (1.0 - curve.x)
      + (d - b) * curve.x * curve.y;
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int octave = 0; octave < 6; octave++) {
      value += amplitude * noise(point);
      point *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    vec2 mouse = u_mouse / u_resolution.xy;
    mouse.x *= u_resolution.x / u_resolution.y;
    float mouseDistance = distance(uv, mouse);

    vec2 firstFlow;
    firstFlow.x = fbm(uv + 0.055 * u_time);
    firstFlow.y = fbm(uv + vec2(1.0, 1.0) - 0.025 * u_time);

    vec2 secondFlow;
    secondFlow.x = fbm(uv + firstFlow + vec2(1.7, 9.2) + 0.11 * u_time);
    secondFlow.y = fbm(uv + firstFlow + vec2(8.3, 2.8) - 0.09 * u_time);

    float fog = fbm(uv + secondFlow);
    float denseFog = smoothstep(0.24, 0.88, fog);

    vec3 midnight = vec3(0.004, 0.012, 0.055);
    vec3 deepBlue = vec3(0.008, 0.055, 0.24);
    vec3 blueFog = vec3(0.018, 0.18, 0.48);
    vec3 color = mix(midnight, deepBlue, fog);
    color = mix(color, blueFog, denseFog * 0.72 + dot(firstFlow, secondFlow) * 0.12);

    float pointerGlow = smoothstep(0.34, 0.0, mouseDistance);
    color += pointerGlow * vec3(0.015, 0.10, 0.22);

    float vignette = smoothstep(0.9, 0.2, distance(gl_FragCoord.xy / u_resolution.xy, vec2(0.5)));
    color *= 0.72 + 0.28 * vignette;
    color = pow(color, vec3(0.92));

    gl_FragColor = vec4(color, 1.0);
  }
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function activateShaderProgram(gl: WebGLRenderingContext, program: WebGLProgram) {
  const activate = gl.useProgram.bind(gl)
  activate(program)
}

export function RealisticFogBackground({ className, speed = 1, ...props }: RealisticFogBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false })
    if (!gl) return

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader)
      if (fragmentShader) gl.deleteShader(fragmentShader)
      return
    }

    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    activateShaderProgram(gl, program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

    const position = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const timeLocation = gl.getUniformLocation(program, "u_time")
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
    const mouseLocation = gl.getUniformLocation(program, "u_mouse")
    const pointer = { x: 0, y: 0 }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.min(4096, Math.round(canvas.clientWidth * ratio)))
      const height = Math.max(1, Math.min(4096, Math.round(canvas.clientHeight * ratio)))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        pointer.x = width / 2
        pointer.y = height / 2
        gl.viewport(0, 0, width, height)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      const ratioX = canvas.width / Math.max(bounds.width, 1)
      const ratioY = canvas.height / Math.max(bounds.height, 1)
      pointer.x = (event.clientX - bounds.left) * ratioX
      pointer.y = (bounds.bottom - event.clientY) * ratioY
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    window.addEventListener("pointermove", handlePointerMove, { passive: true })

    let animationFrame = 0
    const render = (time: number) => {
      resize()
      gl.uniform1f(timeLocation, time * 0.001 * speed)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform2f(mouseLocation, pointer.x, pointer.y)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      if (!reducedMotion) animationFrame = requestAnimationFrame(render)
    }
    animationFrame = requestAnimationFrame(render)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("pointermove", handlePointerMove)
      cancelAnimationFrame(animationFrame)
      if (buffer) gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [speed])

  return (
    <canvas
      ref={canvasRef}
      {...props}
      aria-hidden="true"
      tabIndex={-1}
      className={cn("pointer-events-none absolute inset-0 size-full bg-[#020617]", className)}
    />
  )
}
