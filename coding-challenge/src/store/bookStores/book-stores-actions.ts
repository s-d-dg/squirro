import { bookStoreActions } from './index';
import { BookModel, BookStoreModel } from './model';


export const fetchBookStores = () => {
    return async (dispatch: any) => {
        const fetchData = async () => {
            const response = await fetch('http://localhost:3000/stores?include=books,countries,authors');

            if(!response.ok) {
                throw new Error('Cound not fetch book stores !');
            }

            const jsonResponse = await response.json();
            
            const data = jsonResponse.data;
            const included = jsonResponse.included;

            return normalizeResponse(data, included);;
        } 

        try {
            const bookStoresData = await fetchData();
            dispatch(bookStoreActions.loadBookStoresSuccess(bookStoresData));
           
        } catch  (error) {
            console.log(error);
            dispatch(bookStoreActions.loadBookStoresSuccess([]));
        }
    }
}

function normalizeResponse(data: any[], included: any[]): BookStoreModel[] {
    const relatedBooks = included.filter(el => el.type === 'books');
    const relatedCountries = included.filter(el => el.type === 'countries');
    const relatedAuthors = included.filter(el => el.type === 'authors');
    const BOOK_DISPLAY_MAX_VALUE = 2;

    const bookStores = data.map(el => ({
        id: el.id,
        name: el.attributes.name,
        imgUrl: el.attributes.storeImage,
        establishmentDate: el.attributes.establishmentDate,
        website: el.attributes.website,
        rating: el.attributes.rating,
        country: mapToCountryCode(el.relationships.countries.data.id, relatedCountries),
        bestSellers: mapToBooksWithAuthors(el.relationships.books?.data, relatedBooks, relatedAuthors)
        .sort((a,b) => b.copiesSold - a.copiesSold)
        .splice(0, BOOK_DISPLAY_MAX_VALUE)
    }));
    return [...bookStores];
} 

function mapToCountryCode(id: string, allCountries: any[]): string {
    return allCountries.find(country => country.id === id)?.attributes.code;
}

function mapToBooksWithAuthors(books: any[], allBooks: any[], allAuthors: any[]): BookModel[] {
    if(!books) {
        return [];
    }
    
    const mappedBooks = books.map(book => {
        const mappedBook = getBook(book.id, allBooks);

        if(!mappedBook) {
            return {
                id: book.id,
                title: '',
                author: '',
                copiesSold: 0
            };
        }

        return {
        id: book.id,
        title: mappedBook.title,
        author: getAuthor(mappedBook.authorId, allAuthors),
        copiesSold: mappedBook.copiesSold
        };
});
    return [...mappedBooks];
}

function getBook(id: string, allBooks: any[]): any {
    const foundBook = allBooks.find(book => book.id === id);

    if(!foundBook){
        return null;
    }

    return {
        title: foundBook?.attributes.name,
        copiesSold: foundBook?.attributes.copiesSold,
        authorId: foundBook.relationships.author.data.id
    };
}

function getAuthor(id: string, allAuthors: any[]): string {
    return allAuthors.find(author => author.id === id)?.attributes.fullName;
}