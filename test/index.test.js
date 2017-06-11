import * as babel from 'babel-core';
import {resolve} from 'path';
import babelPluginReactComponentDataAttribute from '../src';

describe('babelPluginReactComponentDataAttribute()', () => {
  it('handles simple returns', () => {
    expect(transform(`
      function MyComponent() {
        return <div />;
      }
    `)).toMatchSnapshot();
  });

  it('does not add attributes to composite components', () => {
    expect(transform(`
      function MyComponent() {
        return <SomeOtherComponent />;
      }
    `)).toMatchSnapshot();
  });
  
  it('handles conditional returns', () => {
    expect(transform(`
      function MyComponent() {
        return true
          ? <div />
          : <span />;
      }
    `)).toMatchSnapshot();

    expect(transform(`
      function MyComponent() {
        if (true) {
          return <div />;
        } else {
          return <span />;
        }
      }
    `)).toMatchSnapshot();
  });

  it('only adds the attribute to the top-level node', () => {
    expect(transform(`
      function MyComponent() {
        return (
          <div><div /></div>
        );
      }
    `)).toMatchSnapshot();

    expect(transform(`
      function MyComponent() {
        return (
          <SomeOtherComponent><div /></SomeOtherComponent>
        );
      }
    `)).toMatchSnapshot();

    expect(transform(`
      function MyComponent() {
        return (
          <SomeOtherComponent>{() => <div />}</SomeOtherComponent>
        );
      }
    `)).toMatchSnapshot();
  });

  it('does not add attributes from a parent function', () => {
    expect(transform(`
      function MyComponent() {
        return () => <div />;
      }
    `)).toMatchSnapshot();
  });

  it('adds the property to React.createElement calls', () => {
    expect(transform(`
      function MyComponent() {
        return React.createElement(someElement, {foo: 'bar'});
      }
    `)).toMatchSnapshot();

    expect(transform(`
      function MyComponent() {
        return React.createElement(someElement);
      }
    `)).toMatchSnapshot();
  });

  describe('name', () => {
    it('uses the variable name when no name exists', () => {
      expect(transform(`
        const MyComponent = class extends React.Component {
          render() {
            return <div />;
          }
        }
      `)).toMatchSnapshot();

      expect(transform(`
        const MyComponent = function() {
          return <div />;
        }
      `)).toMatchSnapshot();
    });

    it('uses the file’s basename when it is not unknown and is not an index file', () => {
      const filename = resolve('MyComponent.js');

      expect(transform(`
        export default class extends React.Component {
          render() {
            return <div />;
          }
        }
      `, {}, {filename})).toMatchSnapshot();

      expect(transform(`
        export default function() {
          return <div />;
        }
      `, {}, {filename})).toMatchSnapshot();

      expect(transform(`
        export default () => {
          return <div />;
        }
      `, {}, {filename})).toMatchSnapshot();
    });

    it('uses the file’s directory name when it is an index file', () => {
      const filename = resolve('MyComponent/index.js');

      expect(transform(`
        export default class extends React.Component {
          render() {
            return <div />;
          }
        }
      `, {}, {filename})).toMatchSnapshot();

      expect(transform(`
        export default function() {
          return <div />;
        }
      `, {}, {filename})).toMatchSnapshot();

      expect(transform(`
        export default () => {
          return <div />;
        }
      `, {}, {filename})).toMatchSnapshot();
    });
  });

  describe('arrow expressions', () => {
    it('handles non-block statement arrow expressions', () => {
      expect(transform(`
        const MyComponent = () => <div />;
      `)).toMatchSnapshot();
    });
  });

  describe('options', () => {
    // describe('')
  });
});

function transform(code, pluginOptions, transformOptions) {
  return babel.transform(code, {
    babelrc: false,
    plugins: [
      [babelPluginReactComponentDataAttribute, pluginOptions],
    ],
    parserOpts: {
      plugins: ['jsx'],
    },
    ...transformOptions,
  }).code.trim();
}
