import { getInitials, nameToColor } from '../utils/calculations'

export default function Avatar({ name, photo, size = 48 }) {
  if (photo) {
    return (
      <div className="avatar" style={{ width: size, height: size }}>
        <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      </div>
    )
  }

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: nameToColor(name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: 1,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
