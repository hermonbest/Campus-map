import React from 'react'
import { render } from '@testing-library/react-native'
import { MapViewer } from '../MapViewer'

describe('MapViewer Component', () => {
  const mockMapUrl = 'https://example.com/map.png'

  it('should render correctly', () => {
    const { getByTestId } = render(<MapViewer mapUrl={mockMapUrl} />)
    expect(getByTestId('map-image')).toBeTruthy()
  })

  it('should display map image', () => {
    const { getByTestId } = render(<MapViewer mapUrl={mockMapUrl} />)
    const image = getByTestId('map-image')
    expect(image.props.source.uri).toBe(mockMapUrl)
  })

  it('should render building markers when provided', () => {
    const buildings = [
      { id: '1', name: 'Test Building', x_pos: 0.5, y_pos: 0.5, color: '#FF0000' },
    ]
    const { getByTestId } = render(
      <MapViewer mapUrl={mockMapUrl} buildings={buildings} />
    )
    expect(getByTestId('building-marker-1')).toBeTruthy()
  })

  it('should call onBuildingPress when marker is pressed', () => {
    const buildings = [
      { id: '1', name: 'Test Building', x_pos: 0.5, y_pos: 0.5, color: '#FF0000' },
    ]
    const onBuildingPress = jest.fn()
    const { getByTestId } = render(
      <MapViewer mapUrl={mockMapUrl} buildings={buildings} onBuildingPress={onBuildingPress} />
    )
    
    const marker = getByTestId('building-marker-1')
    marker.props.onPress()
    
    expect(onBuildingPress).toHaveBeenCalledWith(buildings[0])
  })

  it('should render path when provided', () => {
    const path = ['node1', 'node2', 'node3']
    const nodes = [
      { id: 'node1', x_pos: 0.1, y_pos: 0.1 },
      { id: 'node2', x_pos: 0.5, y_pos: 0.5 },
      { id: 'node3', x_pos: 0.9, y_pos: 0.9 },
    ]
    const { getByTestId } = render(
      <MapViewer mapUrl={mockMapUrl} path={path} nodes={nodes} />
    )
    expect(getByTestId('path-svg')).toBeTruthy()
  })
})
