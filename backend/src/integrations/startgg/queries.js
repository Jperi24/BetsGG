// src/integrations/startgg/queries.js
// For graphql-request, you can use template strings directly
const GET_FEATURED_TOURNAMENTS_QUERY = `
  query FeaturedTournamentsQuery(
    $page: Int
    $perPage: Int
    $afterDate: Timestamp
  ) {
    tournaments(
      query: {
        filter: { afterDate: $afterDate, isFeatured: true }
        page: $page
        perPage: $perPage
      }
    ) {
      nodes {
        id
        name
        slug
        startAt
        endAt
        numAttendees
        images {
          url
        }
        countryCode
        addrState
        city
      }
    }
  }
`;

const GET_ALL_TOURNAMENTS_QUERY = `
  query TournamentQuery(
    $afterDate: Timestamp
    $beforeDate: Timestamp
    $page: Int
    $perPage: Int
  ) {
    tournaments(
      query: {
        filter: { afterDate: $afterDate, beforeDate: $beforeDate }
        page: $page
        perPage: $perPage
      }
    ) {
      pageInfo {
        total
      }
      nodes {
        id
        name
        slug
        startAt
        endAt
        numAttendees
        images {
          url
        }
        countryCode
        addrState
        city
      }
    }
  }
`;

const GET_TOURNAMENT_QUERY = `
  query GetTournamentDetails($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      slug
      startAt
      endAt
      numAttendees
      images {
        url
      }
      countryCode
      addrState
      city
      venueAddress
      events {
        id
        name
        numEntrants
        videogame {
          id
          name
          displayName
        }
        phases {
          id
          name
          numSeeds
          bracketType
        }
      }
    }
  }
`;

const GET_SETS_BY_PHASE_QUERY = `
  query PhaseSets($phaseId: ID!, $page: Int!, $perPage: Int!) {
    phase(id: $phaseId) {
      id
      name
      sets(page: $page, perPage: $perPage, sortType: STANDARD) {
        nodes {
          id
          fullRoundText
          state
          winnerId
          slots {
            id
            standing {
              placement
              stats {
                score {
                  value
                }
              }
            }
            entrant {
              id
              name
              participants {
                id
                gamerTag
              }
            }
          }
        }
      }
    }
  }
`;

const GET_SET_BY_ID_QUERY = `
  query GetSetById($setId: ID!) {
    set(id: $setId) {
      id
      fullRoundText
      state
      winnerId
      slots {
        id
        standing {
          placement
          stats {
            score {
              value
            }
          }
        }
        entrant {
          id
          name
          participants {
            id
            gamerTag
          }
        }
      }
    }
  }
`;

module.exports = {
  GET_FEATURED_TOURNAMENTS_QUERY,
  GET_ALL_TOURNAMENTS_QUERY,
  GET_TOURNAMENT_QUERY,
  GET_SETS_BY_PHASE_QUERY,
  GET_SET_BY_ID_QUERY  
};
