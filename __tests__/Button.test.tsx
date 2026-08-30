import { fireEvent, render } from '@testing-library/react-native';

import { Button } from '@/src/components/Button';

describe('Button', () => {
  it('exposes an accessible label and blocks presses while loading', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button label="Confirm reservation" loading onPress={onPress} />,
    );
    const button = getByRole('button', { name: 'Confirm reservation' });
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
