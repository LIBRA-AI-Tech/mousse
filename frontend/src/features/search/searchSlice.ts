import { createSlice } from '@reduxjs/toolkit';
import { FeatureCollection } from 'geojson';

interface SearchState {
  results: FeatureCollection|null;
}

const initialState: SearchState = {
  results: null,
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    resetResults: (state) => {
      state.results = initialState.results;
    },
    fetchResults: (state) => {
      state.results = geojson;
    }
  },
});

export const { resetResults, fetchResults } = searchSlice.actions;

export default searchSlice.reducer;

const geojson: FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "properties": {
        "title": "Phasellus vulputate ante vitae odio facilisis congue",
        "description": "Donec ornare, ex vitae cursus mattis, odio enim finibus lacus, sit amet pellentesque sapien ante a erat. Donec viverra mi libero, et vestibulum dui fermentum quis. Fusce non velit sit amet sapien mollis egestas non sed ipsum. Morbi rhoncus porta ante, id maximus ipsum condimentum at. Sed tincidunt arcu vitae neque tincidunt, eget semper neque luctus. Ut at mollis ante. Sed metus risus, congue eu feugiat nec, fringilla vel dui. Nam sed urna tellus."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [2.3522, 48.8566]  // Paris, France
      }
    },
    {
      "type": "Feature",
      "id": 2,
      "properties": {
        "title": "Vestibulum rhoncus risus venenatis placerat pellentesque",
        "description": "Integer id tellus vitae turpis malesuada efficitur quis in dolor. Sed vestibulum, purus non lobortis interdum, nibh nulla maximus sapien, at vulputate neque turpis id magna. Proin dui nunc, elementum vitae mauris vel, faucibus finibus eros. Donec id dui ullamcorper, laoreet libero ut, lobortis diam. Praesent ac erat ac nunc elementum cursus vitae vel ligula. Sed ante turpis, iaculis vitae dignissim at, sagittis in magna. Mauris at fermentum ex. Donec quam massa, pretium sed elementum interdum, placerat ac lacus. Sed a felis sit amet nisl eleifend interdum. Suspendisse lacinia porta mi, a vestibulum elit. Vestibulum ultrices, ipsum et ultrices condimentum, ligula felis tristique arcu, interdum lobortis lorem augue eget nunc. Pellentesque imperdiet nec dolor quis tincidunt. Fusce vel porttitor odio."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [12.4964, 41.9028]  // Rome, Italy
      }
    },
    {
      "type": "Feature",
      "id": 3,
      "properties": {
        "title": "Duis auctor quam ac tincidunt hendrerit",
        "description": "Aliquam erat volutpat. Donec a dui enim. Maecenas convallis suscipit felis, quis tempus metus porta congue. Aenean dictum massa quam, eleifend euismod mi ultricies quis. Morbi aliquet ex a arcu iaculis rutrum ut eget tellus. Vivamus euismod dignissim est ut imperdiet. Ut pellentesque enim ipsum, sit amet lobortis nisi egestas at. In hac habitasse platea dictumst. Aliquam ultrices libero augue, sed vulputate mi interdum quis. Suspendisse interdum enim ut tristique fermentum. Morbi a nunc nec massa lacinia rutrum. Nullam ac augue orci. Donec in dolor est."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [16.3725, 48.2082], // Vienna, Austria
            [15.4845, 48.2082],
            [15.4845, 47.0905],
            [16.3725, 47.0905],
            [16.3725, 48.2082]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 4,
      "properties": {
        "title": "Aenean ultrices libero eget erat malesuada tempor",
        "description": "Vestibulum dapibus enim at dui dictum, nec cursus purus lacinia. Donec commodo dignissim placerat. Pellentesque in ullamcorper magna. Ut sagittis, odio id feugiat volutpat, eros lorem varius purus, eget fermentum orci ligula et odio. Vivamus mattis viverra tellus ac interdum. Pellentesque tempor lacinia consectetur. Curabitur eget felis id lorem fringilla scelerisque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam lacinia dui sed arcu tempor, ut bibendum turpis congue. Ut ullamcorper leo id tincidunt imperdiet. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam erat volutpat. Integer tempor efficitur nisi, ornare porta eros aliquet id."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [4.9041, 52.3676]  // Amsterdam, Netherlands
      }
    },
    {
      "type": "Feature",
      "id": 5,
      "properties": {
        "title": "Duis gravida nunc a nisi interdum, at euismod lectus eleifend",
        "description": "Curabitur tempor magna tristique nulla tincidunt, eu commodo nunc ullamcorper. Donec consectetur nibh varius augue porta, eu vulputate elit fermentum. Cras id facilisis est. Nam dui quam, mollis eget vulputate vel, hendrerit et felis. Aliquam id interdum velit. Curabitur sodales augue ex, vel sodales erat pulvinar eget. Morbi efficitur in orci vitae tincidunt. Phasellus viverra molestie magna ac faucibus. Ut et sem vitae ipsum tincidunt feugiat."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [11.1829, 45.4642], // Milan, Italy
            [8.1929, 45.4642],
            [8.1929, 43.4522],
            [11.1829, 43.4522],
            [11.1829, 45.4642]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 6,
      "properties": {
        "title": "Integer vitae nulla sed massa aliquet congue at quis felis",
        "description": "Curabitur non euismod ex, sed placerat lorem. Integer maximus, massa ac facilisis condimentum, mauris augue eleifend augue, et tincidunt mauris sem ut sapien. Nam ac condimentum tortor. Maecenas pretium risus sed tempus sodales. Ut velit orci, tempus vitae quam vitae, semper condimentum erat. Pellentesque et nulla libero. Quisque facilisis, erat vitae rhoncus auctor, ipsum est blandit magna, quis fermentum augue nunc vulputate lorem. Curabitur tincidunt felis eu magna tempus cursus. Cras non fringilla neque, non condimentum urna.Excepteur sint occaecat cupidatat non proident."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [14.5058, 46.0569]  // Ljubljana, Slovenia
      }
    },
    {
      "type": "Feature",
      "id": 7,
      "properties": {
        "title": "Curabitur non diam venenatis, feugiat nisi a, placerat libero",
        "description": "Cras efficitur dui sit amet ex laoreet, non condimentum lectus luctus. Duis fermentum tempus felis eu lobortis. Aenean facilisis sagittis purus sit amet pellentesque. Cras hendrerit fermentum augue at hendrerit. Sed posuere nibh sodales metus gravida, vitae hendrerit lorem blandit. Mauris ut magna et mauris iaculis dapibus. Mauris facilisis, velit vel posuere laoreet, nisl eros vehicula lacus, ac blandit lectus lorem sit amet tellus. Nullam porttitor congue tellus non pulvinar. Morbi pretium ante vel erat tincidunt, sed molestie mi interdum. Fusce sed tincidunt lorem, quis finibus ante. Nunc dictum semper leo id convallis. Nulla vitae purus porta, facilisis nisl sit amet, rhoncus ligula. Etiam arcu metus, ullamcorper id suscipit mattis, aliquet vel mauris. Nam congue lorem ac nisi blandit hendrerit. Integer pulvinar lectus metus, nec varius massa volutpat ullamcorper. Curabitur sollicitudin ligula non nunc viverra, eget pharetra diam pharetra."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [19.0402, 47.4979], // Budapest, Hungary
            [16.0502, 47.4979],
            [16.0502, 46.4879],
            [19.0402, 46.4879],
            [19.0402, 47.4979]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 8,
      "properties": {
        "title": "Sed et nisl quis massa semper sodales ac ut quam",
        "description": "Integer scelerisque, urna eget sollicitudin elementum, metus justo sodales nisl, placerat bibendum orci enim ac massa. Curabitur eu fringilla ante. Praesent rhoncus, felis id aliquet pretium, metus risus vestibulum elit, in convallis mi ligula sed nunc. Vestibulum quis ornare libero. Nulla facilisi. Suspendisse vel ipsum vitae ligula accumsan congue. Aliquam dolor felis, tempor vitae maximus viverra, tempus ac metus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Curabitur volutpat, leo vel elementum porttitor, nisl justo tempor elit, non varius velit arcu a turpis. Praesent laoreet tellus vel fermentum accumsan. Quisque eu ipsum a ipsum condimentum maximus in nec quam. Donec elementum diam dapibus ante placerat suscipit."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-3.7038, 40.4168]  // Madrid, Spain
      }
    },
    {
      "type": "Feature",
      "id": 9,
      "properties": {
        "title": "Cras dui velit, auctor in ipsum non, scelerisque porta velit",
        "description": "Praesent venenatis lorem sit amet ante mattis, sed rutrum lorem hendrerit. Nullam dapibus volutpat sagittis. Pellentesque ullamcorper bibendum sapien, et posuere diam venenatis id. Quisque aliquam velit at nisl convallis euismod. Sed sodales leo a sapien interdum, sed mattis turpis rhoncus. Cras interdum dui sed ornare ullamcorper. Quisque volutpat tincidunt nunc, non condimentum quam vestibulum in. Morbi semper tellus quis ligula aliquet bibendum. Maecenas vehicula eget libero sit amet interdum. Duis posuere urna vel dignissim pharetra. Nulla fringilla condimentum dolor. Nunc sed eros nisi. Aliquam ipsum lorem, pulvinar eget libero eget, consequat imperdiet felis."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [18.0686, 59.3293], // Stockholm, Sweden
            [21.0786, 59.3293],
            [21.0786, 56.3193],
            [18.0686, 56.3193],
            [18.0686, 59.3293]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 10,
      "properties": {
        "title": "Donec placerat nisl vel eros tempus rhoncus",
        "description": "Nam sed convallis augue. Phasellus turpis enim, pellentesque a venenatis sit amet, rutrum ac quam. Nam vestibulum facilisis nisl, vitae malesuada ante commodo eu. Donec at luctus massa. Nam a eros at nisl ultrices venenatis sit amet vel nisi. Quisque sollicitudin mauris enim, in molestie est euismod vel. Nunc laoreet sed velit vitae lobortis. Aenean a elit odio. Sed molestie nulla vel arcu tincidunt volutpat."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [18.4241, 48.1486]  // Bratislava, Slovakia
      }
    }
  ]
}
